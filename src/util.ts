export const removeEmpty = (obj: { [key: string]: any }): any => {
  let newObj: { [key: string]: any } = {};
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object") newObj[key] = removeEmpty(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};