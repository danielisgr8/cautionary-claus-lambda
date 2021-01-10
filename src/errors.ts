class NamedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NoActivityError extends NamedError {}
export class AuthenticationError extends NamedError {}
export class BadRequestError extends NamedError {}
export class InternalError extends NamedError {}
export class UnauthorizedError extends NamedError {}
export class ItemNotFoundError extends NamedError {}
