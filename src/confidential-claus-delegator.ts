import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Authorizer } from "./authorizer";
import { Delegator, RequestEvent } from "./delegator";
import { DynamoDBClientFacade } from "./dynamodb-client-facade";
import { BadRequestError, UnauthorizedError } from "./errors";
import { buildNewUser, buildUserUpdate, NewUser, User, UserUpdate } from "./models";
import { alphanumeric, emptyString, shuffle } from "./util";

export class ConfidentialClausDelegator extends Delegator {
  private ddbClient: DynamoDBClientFacade;

  constructor(ddb: DynamoDBClient) {
    super();

    this.ddbClient = new DynamoDBClientFacade(ddb);

    this.addActivity("/user", "POST", async (event) => {
      if(event.body === undefined) throw new BadRequestError("Request body cannot be empty");
      let body: any;
      try {
        body = JSON.parse(event.body);
      } catch(e) {
        throw new BadRequestError("Request body is not valid JSON");
      }

      const invalidMessages: string[] = [];
      if(emptyString(body["username"]) || /\s/.test(body["username"])) {
        invalidMessages.push("username is empty or contains spaces");
      }
      ["firstName", "lastName"].forEach((prop) => {
        if(emptyString(body[prop])) {
          invalidMessages.push(`${prop} is empty`);
        }
      });
      if(typeof body["address"] !== "object") {
        invalidMessages.push("address is not an object");
      } else {
        ["line1", "city", "usState", "zip"].forEach((prop) => {
          if(!(prop in body["address"]) || emptyString(body["address"][prop])) {
            invalidMessages.push(`${prop} is empty`);
          }
        });
      }

      if(invalidMessages.length === 0) {
        let newUser: NewUser;
        try {
          newUser = buildNewUser(body);
        } catch (error) {
          throw new BadRequestError("Request body is missing properties: " + error);
        }
        await this.ddbClient.createUser(newUser);
      } else {
        throw new BadRequestError(`Request had the folloring errors: ${invalidMessages}`);
      }
    });

    this.addActivity("/users", "GET", async () => {
      return await this.userList();
    });

    this.addActivity("/profile/{username}", "GET", async (event) => {
      const requestedUser = this.getRequestedUser(event);
      const {
        assignedUser,
        notes,
        ...filteredResult
      } = await this.ddbClient.getUser(requestedUser);
      const result = filteredResult as any;

      if(Authorizer.authorizeUser(event.authenticatedUser, requestedUser, await this.userList())) {
        result["assignedUser"] = assignedUser;
      } else {
        result["notes"] = notes;
      }

      return filteredResult;
    });
    
    this.addActivity("/profile/{username}", "PUT", async (event) => {
      if(event.body === undefined) throw new BadRequestError("Request must have a body");
      let body: any;
      try {
        body = JSON.parse(event.body);
      } catch(e) {
        throw new BadRequestError("Request body is not valid JSON");
      }

      const requestedUser = this.getRequestedUser(event);
      if(Authorizer.authorizeUser(event.authenticatedUser, requestedUser, await this.userList())) {
        let userUpdate: UserUpdate;
        try {
          userUpdate = buildUserUpdate(body);
        } catch (error) {
          throw new BadRequestError("Request body is missing properties: " + error);
        }
        await this.ddbClient.updateUser(requestedUser, userUpdate);
      } else {
        throw new UnauthorizedError("Authenticated user and user whose profile is being updated must match");
      }
    });

    this.addActivity("/profile/{username}/note", "PUT", async (event) => {
      if (event.body === undefined) throw new BadRequestError("Request must have a body");
      let body: any;
      try {
        body = JSON.parse(event.body);
      } catch(e) {
        throw new BadRequestError("Request body is not valid JSON");
      }
      if (emptyString(body.message)) throw new BadRequestError("message must not be empty");

      const requestedUser = this.getRequestedUser(event);
      if(Authorizer.authorizeNotUser(event.authenticatedUser, requestedUser, await this.userList())) {
        const noteId = alphanumeric(8);
        await this.ddbClient.addNote(requestedUser, { id: noteId, message: body.message });
        return { id: noteId };
      } else {
        throw new UnauthorizedError("Authenticated user and user to add note to must not match");
      }
    });

    this.addActivity("/profile/{username}/note", "DELETE", async (event) => {
      if(event.queryStringParameters === undefined || event.queryStringParameters.id === undefined) {
        throw new BadRequestError("No note ID provided");
      }
      const requestedUser = this.getRequestedUser(event);
      if(Authorizer.authorizeNotUser(event.authenticatedUser, requestedUser, await this.userList())) {
        await this.ddbClient.deleteNote(requestedUser, event.queryStringParameters.id);
      } else {
        throw new UnauthorizedError("Authenticated user and user to delete note from must not match");
      }
    });

    this.addActivity("/admin/assign-all", "PUT", async (event) => {
      if(Authorizer.authorizeAdmin(event.authenticatedUser, await this.userList())) {
        const users = await this.ddbClient.getAllUsers();
        const assigned = Array.from(users);
        do {
          shuffle(assigned);
        } while (this.badShuffle(users, assigned));
        
        await Promise.all(users.map(async (user, i) => {
          await this.ddbClient.assignUser(user.username, assigned[i].username);
        }));
      } else {
        throw new UnauthorizedError("Authenticated user must be an admin");
      }
    });

    this.addActivity("/admin/assign/{username}", "PUT", async (event) => {
      if (event.body === undefined) throw new BadRequestError("Request must have a body");
      let body: any;
      try {
        body = JSON.parse(event.body);
      } catch(e) {
        throw new BadRequestError("Request body is not valid JSON");
      }
      if (emptyString(body.assignedUser)) throw new BadRequestError("message must not be empty");
      const giverUsername = this.getRequestedUser(event);

      if(Authorizer.authorizeAdmin(event.authenticatedUser, await this.userList())) {
        await this.ddbClient.assignUser(giverUsername, body.assignedUser);
      } else {
        throw new UnauthorizedError("Authenticated user must be an admin");
      }
    });
  }

  private async userList(): Promise<string[]> {
    return (await this.ddbClient.getAllUsers()).map((user) => user.username);
  }

  private getRequestedUser(event: RequestEvent): string {
    if(event.pathParameters === undefined || event.pathParameters["username"] === undefined) {
      throw new BadRequestError("No username path parameter provided");
    }

    return event.pathParameters["username"];
  }

  private badShuffle(list1: User[], list2: User[]) {
    return list1.some((user, i) => user.username === list2[i].username);
  }
}