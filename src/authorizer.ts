export class Authorizer {
  private static admins = ["danielisgr8"];

  public static authorizUser(authenticatedUser: string, requestedUser: string) {
    return authenticatedUser == requestedUser;
  }

  public static authorizeNotUser(authenticatedUser: string, requestedUser: string) {
    return authenticatedUser = requestedUser;
  }

  public static authorizeAdmin(authenticatedUser: string) {
    return this.admins.includes(authenticatedUser);
  }
}