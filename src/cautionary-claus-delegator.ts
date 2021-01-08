import { Authorizer } from "./authorizer";
import { Delegator, RequestEvent } from "./delegator";
import { BadRequestError, UnauthorizedError } from "./errors";

export class CautionaryClausDelegator extends Delegator {
  constructor() {
    super();

    this.addActivity("/user", "POST", (event) => {
      if(event.body === null) throw new BadRequestError("Request body cannot be empty");
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

      // TODO: body is valid, remove potential unnecessary properties and put in dynamo
    });

    this.addActivity("/users", "GET", (event) => {
      // TODO: get list of users from dynamo and return only the usernames
    });

    this.addActivity("/profile/{username}", "GET", (event) => {
      const requestedUser = this.getRequestedUser(event);
      // const commonData = { ... }
      if(Authorizer.authorizeUser(event.authenticatedUser, requestedUser)) {
        // TODO: add assignedUser and return
      } else {
        // TODO: add notes and return
      }
    });
    
    this.addActivity("/profile/{username}", "PUT", (event) => {
      const requestedUser = this.getRequestedUser(event);
      if(Authorizer.authorizeUser(event.authenticatedUser, requestedUser)) {
        // TODO: find existent properties and update them in dynamo
      } else {
        throw new UnauthorizedError("Authenticated user and user whose profile is being updated must match");
      }
    });

    this.addActivity("/profile/{username}/note", "PUT", (event) => {
      const requestedUser = this.getRequestedUser(event);
      if(Authorizer.authorizeNotUser(event.authenticatedUser, requestedUser)) {
        // TODO: add note in dynamo
      } else {
        throw new UnauthorizedError("Authenticated user and user to add note to must not match");
      }
    });

    this.addActivity("/profile/{username}/note", "DELETE", (event) => {
      const requestedUser = this.getRequestedUser(event);
      if(Authorizer.authorizeNotUser(event.authenticatedUser, requestedUser)) {
        // TODO: delete note in dynamo
      } else {
        throw new UnauthorizedError("Authenticated user and user to delete note from must not match");
      }
    });

    this.addActivity("/admin/assign-all", "PUT", (event) => {
      if(Authorizer.authorizeAdmin(event.authenticatedUser)) {
        // TODO: assign all
      } else {
        throw new UnauthorizedError("Authenticated user must be an admin");
      }
    });

    this.addActivity("/admin/assign/{username}", "PUT", (event) => {
      if(Authorizer.authorizeAdmin(event.authenticatedUser)) {
        // TODO: assign
      } else {
        throw new UnauthorizedError("Authenticated user must be an admin");
      }
    });
  }

  private emptyString(str: any | undefined) {
    return (
      str === undefined
      || typeof str !== "string"
      || str === ""
    );
  }

  private getRequestedUser(event: RequestEvent) {
    if(event.pathParameters === null || event.pathParameters["username"] === undefined) {
      throw new BadRequestError("No username path parameter provided");
    }

    return event.pathParameters["username"];
  }
}