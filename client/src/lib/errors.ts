export class AppError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AppError';
    }
}

export class NetworkError extends AppError {
    constructor(message = 'Network error occurred') {
        super(message);
        this.name = 'NetworkError';
    }
}

export class ServerError extends AppError {
    public statusCode: number;

    constructor(statusCode: number, message = 'Server error occurred') {
        super(message);
        this.name = 'ServerError';
        this.statusCode = statusCode;
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}
