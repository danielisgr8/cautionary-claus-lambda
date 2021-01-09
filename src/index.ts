import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ConfidentialClausDelegator } from "./confidential-claus-delegator";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: "us-west-2" });

const delegator = new ConfidentialClausDelegator(ddb);

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log("EVENT:\n" + JSON.stringify(event));

  const [method, path] = event.routeKey.split(" ");
  const result = await delegator.delegate(path, method, event);

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  }
}
