export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: string,
    message: string,
    options?: { status?: number; details?: unknown },
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = options?.status ?? 400;
    this.details = options?.details;
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(
      "NOT_FOUND",
      id ? `${entity} '${id}' was not found.` : `${entity} was not found.`,
      { status: 404 },
    );
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super("FORBIDDEN", message, { status: 403 });
    this.name = "ForbiddenError";
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, { status: 422, details });
    this.name = "ValidationAppError";
  }
}
