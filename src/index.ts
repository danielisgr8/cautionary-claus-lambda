import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ConfidentialClausDelegator } from "./confidential-claus-delegator";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: "us-west-2" });

const delegator = new ConfidentialClausDelegator(ddb);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  delegator.delegate(event.path, event.httpMethod, event);

  return {
    statusCode: 200,
    body: `hello! ${JSON.stringify(event.pathParameters)}`
  }
}
