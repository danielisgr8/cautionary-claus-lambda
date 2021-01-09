import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ConfidentialClausDelegator } from "./confidential-claus-delegator";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: "us-west-2" });

const delegator = new ConfidentialClausDelegator(ddb);

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const result = await delegator.delegate(event.requestContext.http.path, event.requestContext.http.method, event);

  return {
    statusCode: 200,
    body: `${result}`
  }
}
