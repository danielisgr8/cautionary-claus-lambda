import { APIGatewayProxyEventV2 } from "aws-lambda";
import { AuthenticationError, NoActivityError } from "./errors";

export interface RequestEvent extends APIGatewayProxyEventV2 {
  authenticatedUser: string,
}

export interface Activity {
  (event: RequestEvent): Promise<any>;
}

export class Delegator {
  private activityMap: { [path: string]: { [method: string]: Activity } };

  constructor() {
    this.activityMap = {};
  }

  protected addActivity(path: string, method: string, activity: Activity) {
    if(!(path in this.activityMap)) this.activityMap[path] = {};
    this.activityMap[path][method] = activity;
  }

  public delegate(path: string, method: string, event: APIGatewayProxyEventV2) {
    if(!(path in this.activityMap) || !(method in this.activityMap[path])) {
      throw new NoActivityError(`No activity configured for ${method}:${path}`);
    }

    let authenticatedUser: string;
    if(event.headers["authorization"] === undefined) {
      throw new AuthenticationError("No Authorization header provided");
    } else {
      try {
        authenticatedUser = event.headers["authorization"].split(" ")[1];
      } catch(e) {
        throw new AuthenticationError("Authorization header is malformed");
      }
    }

    return this.activityMap[path][method]({
      ...event,
      authenticatedUser
    });
  }
}