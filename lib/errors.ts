export class AppError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly statusCode: number = 500
	) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string) {
		super(`${resource} not found`, 'NOT_FOUND', 404);
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 'VALIDATION_ERROR', 400);
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string) {
		super(message, 'FORBIDDEN', 403);
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super(message, 'CONFLICT', 409);
	}
}
