import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Authorizer } from "./authorizer";
import { Delegator, RequestEvent } from "./delegator";
import { DynamoDBClientFacade, NewUser, UserUpdate } from "./dynamodb-client-facade";
import { BadRequestError, UnauthorizedError } from "./errors";

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
      if(this.emptyString(body["username"]) || /\s/.test(body["username"])) {
        invalidMessages.push("username is empty or contains spaces");
      }
      ["firstName", "lastName"].forEach((prop) => {
        if(this.emptyString(body[prop])) {
          invalidMessages.push(`${prop} is empty`);
        }
      });
      if(typeof body["address"] !== "object") {
        invalidMessages.push("address is not an object");
      } else {
        ["line1", "city", "state", "zip"].forEach((prop) => {
          if(!(prop in body["address"]) || this.emptyString(body["address"][prop])) {
            invalidMessages.push(`${prop} is empty`);
          }
        });
      }

      if(invalidMessages.length === 0) {
        await this.ddbClient.createUser(body as NewUser);
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
      let update: any;
      try {
        update = JSON.parse(event.body);
      } catch(e) {
        throw new BadRequestError("Request body is not valid JSON");
      }

      const requestedUser = this.getRequestedUser(event);
      if(Authorizer.authorizeUser(event.authenticatedUser, requestedUser, await this.userList())) {
        await this.ddbClient.updateUser(requestedUser, update as UserUpdate);
      } else {
        throw new UnauthorizedError("Authenticated user and user whose profile is being updated must match");
      }
    });

    this.addActivity("/profile/{username}/note", "PUT", async (event) => {
      const requestedUser = this.getRequestedUser(event);
      if(Authorizer.authorizeNotUser(event.authenticatedUser, requestedUser, await this.userList())) {
        // TODO: add note in dynamo
      } else {
        throw new UnauthorizedError("Authenticated user and user to add note to must not match");
      }
    });

    this.addActivity("/profile/{username}/note", "DELETE", async (event) => {
      const requestedUser = this.getRequestedUser(event);
      if(Authorizer.authorizeNotUser(event.authenticatedUser, requestedUser, await this.userList())) {
        // TODO: delete note in dynamo
      } else {
        throw new UnauthorizedError("Authenticated user and user to delete note from must not match");
      }
    });

    this.addActivity("/admin/assign-all", "PUT", async (event) => {
      if(Authorizer.authorizeAdmin(event.authenticatedUser, await this.userList())) {
        // TODO: assign all
      } else {
        throw new UnauthorizedError("Authenticated user must be an admin");
      }
    });

    this.addActivity("/admin/assign/{username}", "PUT", async (event) => {
      if(Authorizer.authorizeAdmin(event.authenticatedUser, await this.userList())) {
        // TODO: assign
      } else {
        throw new UnauthorizedError("Authenticated user must be an admin");
      }
    });
  }

  private async userList(): Promise<string[]> {
    return (await this.ddbClient.getAllUsers()).map((user) => user.username);
  }

  private emptyString(str: any | undefined): boolean {
    return (
      str === undefined
      || typeof str !== "string"
      || str === ""
    );
  }

  private getRequestedUser(event: RequestEvent): string {
    if(event.pathParameters === undefined || event.pathParameters["username"] === undefined) {
      throw new BadRequestError("No username path parameter provided");
    }

    return event.pathParameters["username"];
  }
}