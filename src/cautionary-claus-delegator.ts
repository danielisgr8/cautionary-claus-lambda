import { Delegator } from "./delegator";

export class CautionaryClausDelegator extends Delegator {
  constructor() {
    super();

    this.addActivity("/user", "POST", (event) => {
      // create user
    });

    this.addActivity("/users", "GET", (event) => {
      // get users
    });

    this.addActivity("/profile/{username}", "GET", (event) => {
      // get profile
    });
    
    this.addActivity("/profile/{username}", "PUT", (event) => {
      // update profile
    });

    this.addActivity("/profile/{username}/note", "PUT", (event) => {
      // add note
    });

    this.addActivity("/profile/{username}/note", "DELETE", (event) => {
      // delete note
    });

    this.addActivity("/admin/assign-all", "PUT", (event) => {
      // assign all
    });

    this.addActivity("/admin/assign/{username}", "PUT", (event) => {
      // assign to user
    });
  }
}