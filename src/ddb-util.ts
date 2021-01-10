import { marshall } from "@aws-sdk/util-dynamodb";
import { UserUpdate } from "./models";

const getExpressionAndValuesHelper = (obj: { [key: string]: any }, values: { [key: string]: any }, prefix: string) => {
  let expression = "";
  const accessorString = prefix + (prefix === "" ? "" : ".");
  for (const property in obj) {
    if (typeof obj[property] === "object") {
      expression += getExpressionAndValuesHelper(obj[property], values, `${accessorString}${property}`);
    } else {
      const valueName = `:ddb${prefix.replace(/\./g, "")}${property}`;
      expression += ` ${accessorString}${property} = ${valueName} ,`;
      values[valueName] = obj[property as keyof UserUpdate];
    }
  }
  return expression;
}

export const getExpressionAndValues = (obj: { [key: string]: any }) => {
  let expression = "set";
  let values: { [key: string]: any } = {};
  expression += getExpressionAndValuesHelper(obj, values, "");

  expression = expression.slice(0, -1);
  values = marshall(values);
  return { expression, values };
}
