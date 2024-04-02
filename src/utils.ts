export class ErrorClass extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.message = message;
    this.status = status;
  }
}

export class GetGroupsResponseClass {
  constructor(public places: any[], public groups: any[]) {}
}
