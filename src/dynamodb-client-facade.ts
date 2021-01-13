import { AttributeValue, DynamoDBClient, QueryCommand, ScanCommand, ScanInput, Update, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { BadRequestError, ItemNotFoundError } from "./errors";
import { removeEmpty } from "./util";
import { getExpressionAndValues } from "./ddb-util";
import { NewUser, Note, User, UserUpdate } from "./models";

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
    if(results.Items === undefined || results.Count != 1) throw new ItemNotFoundError("Requested user does not exist: " + username);

    return unmarshall(results.Items[0]) as unknown as User;
  }

  public async getAllUsers(): Promise<User[]> {
    const users: User[] = [];
    let exclusiveStartKey: { [key: string]: AttributeValue } | undefined = undefined;

    do {
      const input: ScanInput = { TableName: this.tableName };
      if(exclusiveStartKey !== undefined) input["ExclusiveStartKey"] = exclusiveStartKey;
      const command = new ScanCommand(input);
      
      const results = await this.ddb.send(command);
      results.Items?.forEach((item) => users.push(unmarshall(item) as unknown as User));
      exclusiveStartKey = results?.LastEvaluatedKey;
    } while (exclusiveStartKey !== undefined);

    return users;
  }

  public async createUser(user: NewUser) {
    const { username, ...rest } = user;
    try {
      await this.getUser(username);
    } catch (error) {
      const createAddressMapCommand = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ username }),
        UpdateExpression: "set address = :v1, notes = :v2",
        ExpressionAttributeValues: marshall({
          ":v1": {},
          ":v2": []
        })
      });
      await this.ddb.send(createAddressMapCommand);
      await this.updateUser(username, rest);
      return;
    }
    throw new BadRequestError(`User ${username} already exists`);
  }

  public async updateUser(username: string, update: UserUpdate) {
    const strippedUpdate: { [key: string]: any } = removeEmpty(update);
    console.log("Stripped update object:\n" + JSON.stringify(strippedUpdate));
    if(Object.keys(strippedUpdate).length === 0) return;

    const { expression: updateExpression, values: expressionAttributeValues } = getExpressionAndValues(strippedUpdate);
    console.log("Update expression:\n" + updateExpression);
    console.log("Attribute values:\n" + JSON.stringify(expressionAttributeValues));

    const command = new UpdateItemCommand({
      TableName: this.tableName,
      Key: marshall({ username }),
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues
    });
    await this.ddb.send(command);
  }

  public async addNote(username: string, note: Note) {
    const input = {
      TableName: this.tableName,
      Key: marshall({ username }),
      UpdateExpression: "set notes = list_append(notes, :v)",
      ExpressionAttributeValues: marshall({
        ":v": [note as any]
      })
    };
    let command = new UpdateItemCommand(input);
    try {
      await this.ddb.send(command);
    } catch (error) {
      input.UpdateExpression = "set notes = :v";
      command = new UpdateItemCommand(input);
      await this.ddb.send(command);
    }
  }

  public async deleteNote(username: string, noteId: string) {
    const user = await this.getUser(username);
    const deleteIndex = user.notes.findIndex((note) => note.id === noteId);
    if(deleteIndex >= 0) {
      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ username }),
        UpdateExpression: `remove notes[${deleteIndex}]`,
        ConditionExpression: `notes[${deleteIndex}].id = :v`,
        ExpressionAttributeValues: marshall({
          ":v": noteId
        })
      });
      await this.ddb.send(command);
    } else {
      throw new ItemNotFoundError(`Note with ID ${noteId} does not exist`);
    }
  }

  public async assignUser(giverUsername: string, receiverUsername: string) {
    await this.getUser(receiverUsername);
    const command = new UpdateItemCommand({
      TableName: this.tableName,
      Key: marshall({ username: giverUsername }),
      UpdateExpression: `set assignedUser = :v`,
      ExpressionAttributeValues: marshall({
        ":v": receiverUsername
      })
    });
    await this.ddb.send(command);
  }
}