import { AttributeValue, DynamoDBClient, QueryCommand, ScanCommand, ScanInput, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ItemNotFoundError } from "./errors";
import { removeEmpty } from "./util";

export interface Note {
  id: string,
  message: string
}

export interface NewUser {
  username: string,
  firstName: string,
  lastName: string,
  address: {
    line1: string,
    line2: string,
    city: string,
    state: string,
    zip: string
  },
}

export interface User extends NewUser {
  notes: Note[],
  assignedUser: string
}

export interface UserUpdate {
  firstName?: string,
  lastName?: string,
  address?: {
    line1?: string,
    line2?: string,
    city?: string,
    state?: string,
    zip?: string
  }
}

export class DynamoDBClientFacade {
  private readonly tableName = "ConfidentialClausUserTable";
  private ddb: DynamoDBClient;

  constructor(ddb: DynamoDBClient) {
    this.ddb = ddb;
  }

  public async getUser(username: string): Promise<User> {
    const command = new QueryCommand({
      TableName: this.tableName,
      ExpressionAttributeValues: marshall({
        ":v": username
      }),
      KeyConditionExpression: "username = :v",
    });
    const results = await this.ddb.send(command);
    if(results.Items === undefined || results.Count != 1) throw new ItemNotFoundError("Requested user does not exist");

    return unmarshall(results.Items[0]) as User;
  }

  public async getAllUsers(): Promise<User[]> {
    const users: User[] = [];
    let exclusiveStartKey: { [key: string]: AttributeValue } | undefined = undefined;

    do {
      const input: ScanInput = { TableName: this.tableName };
      if(exclusiveStartKey !== undefined) input["ExclusiveStartKey"] = exclusiveStartKey;
      const command = new ScanCommand(input);
      
      const results = await this.ddb.send(command);
      results.Items?.forEach((item) => users.push(unmarshall(item) as User));
      exclusiveStartKey = results?.LastEvaluatedKey;
    } while (exclusiveStartKey !== undefined);

    return users;
  }

  public async createUser(user: NewUser) {

  }

  public async updateUser(username: string, update: UserUpdate) {
    const strippedUpdate: { [key: string]: any } = removeEmpty(update);
    if(Object.keys(strippedUpdate).length === 0) return;

    let updateExpression='set';
    let expressionAttributeValues: { [key: string]: any } = {};
    for (const property in strippedUpdate) {
      updateExpression += ` ${property} = :${property} ,`;
      expressionAttributeValues[`:${property}`] = strippedUpdate[property as keyof UserUpdate];
    }
    updateExpression = updateExpression.slice(0, -1);
    expressionAttributeValues = marshall(expressionAttributeValues);

    const command = new UpdateItemCommand({
      TableName: this.tableName,
      Key: marshall({ username }),
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues
    });
    await this.ddb.send(command);
  }

  public async addNote(username: string, note: Note) {

  }

  public async deleteNote(username: string, noteId: string) {

  }

  public async assignUser(giverUsername: string, receiverUsername: string) {

  }
}