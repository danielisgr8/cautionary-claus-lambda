import { APIGatewayProxyEvent } from "aws-lambda";

export interface Activity {
  (event: APIGatewayProxyEvent): any;
}

export class NoActivityError extends Error {}

export class Delegator {
  private activityMap: { [path: string]: { [method: string]: Activity } };

  constructor() {
    this.activityMap = {};
  }

  protected addActivity(path: string, method: string, activity: Activity) {
    if(!(path in this.activityMap)) this.activityMap[path] = {};
    this.activityMap[path][method] = activity;
  }

  public delegate(path: string, method: string, event: APIGatewayProxyEvent) {
    if(!(path in this.activityMap) || !(method in this.activityMap[path])) {
      throw new NoActivityError(`No activity configured for ${method}:${path}`);
    }

    return this.activityMap[path][method](event);
  }
}