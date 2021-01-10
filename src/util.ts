export const removeEmpty = (obj: { [key: string]: any }): any => {
  let newObj: { [key: string]: any } = {};
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object") newObj[key] = removeEmpty(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};

export const alphanumeric = (length: number) => {
  let str = "";
  for (let i = 0; i < length; i++) {
    const raw = Math.floor(Math.random() * 36);
    let char = "";
    if(raw < 10) {
      char = raw.toString();
    } else {
      char = String.fromCharCode(raw + 87);
    }
    str += char;
  }
  return str;
};

const randInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min;
}

const swap = (arr: any[], i: number, j: number) => {
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
}

export const shuffle = (arr: any[]) => {
  for(let i = arr.length - 1; i >= 1; i--) {
    let j = randInt(0, i + 1);
    swap(arr, i, j);
  }
}
