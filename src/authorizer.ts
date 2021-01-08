export class Authorizer {
  private static admins = ["danielisgr8"];

  public static authorizeUser(authenticatedUser: string, requestedUser: string, allUsers: string[]) {
    return allUsers.includes(authenticatedUser) && authenticatedUser === requestedUser;
  }

  public static authorizeNotUser(authenticatedUser: string, requestedUser: string, allUsers: string[]) {
    return allUsers.includes(authenticatedUser) && authenticatedUser !== requestedUser;
  }

  public static authorizeAdmin(authenticatedUser: string, allUsers: string[]) {
    return allUsers.includes(authenticatedUser) && this.admins.includes(authenticatedUser);
  }
}