import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { CautionaryClausDelegator } from "./cautionary-claus-delegator";

const delegator = new CautionaryClausDelegator();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  delegator.delegate(event.path, event.httpMethod, event);

  return {
    statusCode: 200,
    body: `hello! ${JSON.stringify(event.pathParameters)}`
  }
}
