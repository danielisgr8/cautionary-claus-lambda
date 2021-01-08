import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ConfidentialClausDelegator } from "./confidential-claus-delegator";

const delegator = new ConfidentialClausDelegator();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  delegator.delegate(event.path, event.httpMethod, event);

  return {
    statusCode: 200,
    body: `hello! ${JSON.stringify(event.pathParameters)}`
  }
}
