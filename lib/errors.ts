type AppErrorOptions = {
	cause?: unknown;
};

export class AppError extends Error {
	readonly code: string;
	readonly statusCode: number;

	constructor(message: string, code: string, statusCode = 500, options?: AppErrorOptions) {
		super(message, options);
		this.name = this.constructor.name;
		this.code = code;
		this.statusCode = statusCode;
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string, options?: AppErrorOptions) {
		super(`${resource} not found`, 'NOT_FOUND', 404, options);
	}
}

export class ValidationError extends AppError {
	readonly field?: string;

	constructor(message: string, field?: string, options?: AppErrorOptions) {
		super(message, 'VALIDATION_ERROR', 400, options);
		this.field = field;
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string, options?: AppErrorOptions) {
		super(message, 'FORBIDDEN', 403, options);
	}
}

export class ConflictError extends AppError {
	constructor(message: string, options?: AppErrorOptions) {
		super(message, 'CONFLICT', 409, options);
	}
}
