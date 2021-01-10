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
    line2?: string,
    city: string,
    usState: string,
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
    usState?: string,
    zip?: string
  }
}

export const buildNewUser = (obj: any): NewUser => {
  [obj.username,
    obj.firstName,
    obj.lastName,
    obj.address.line1,
    obj.address.city,
    obj.address.usState,
    obj.address.zip].forEach((val) => { if (val === undefined) throw new Error("Property missing") });
  return {
    username: obj.username,
    firstName: obj.firstName,
    lastName: obj.lastName,
    address: {
      line1: obj.address.line1,
      line2: obj.address?.line2,
      city: obj.address.city,
      usState: obj.address.usState,
      zip: obj.address.zip
    }
  }
}

export const buildUserUpdate = (obj: any): UserUpdate => {
  return {
    firstName: obj?.firstName,
    lastName: obj?.lastName,
    address: {
      line1: obj?.address?.line1,
      line2: obj?.address?.line2,
      city: obj?.address?.city,
      usState: obj?.address?.usState,
      zip: obj?.address?.zip
    }
  }
}
