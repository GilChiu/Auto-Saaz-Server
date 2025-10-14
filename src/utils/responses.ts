import { Response } from 'express';
import env from '../config/env';

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: any[];
    meta?: {
        timestamp: string;
        [key: string]: any;
    };
}

/**
 * Create a success response
 */
export const createResponse = <T = any>(
    success: boolean,
    message: string,
    data?: T,
    meta?: Record<string, any>
): ApiResponse<T> => {
    return {
        success,
        message,
        ...(data && { data }),
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
    };
};

/**
 * Create an error response
 */
export const createErrorResponse = (
    message: string,
    error?: string,
    errors?: any[]
): ApiResponse => {
    return {
        success: false,
        message,
        ...(errors && { errors }),
        ...(error && env.NODE_ENV !== 'production' && { data: { error } }),
        meta: {
            timestamp: new Date().toISOString(),
        },
    };
};

/**
 * Success response (200)
 */
export const successResponse = <T = any>(
    res: Response,
    data: T,
    message = 'Success'
): Response => {
    return res.status(200).json(createResponse(true, message, data));
};

/**
 * Created response (201)
 */
export const createdResponse = <T = any>(
    res: Response,
    data: T,
    message = 'Resource created successfully'
): Response => {
    return res.status(201).json(createResponse(true, message, data));
};

/**
 * No content response (204)
 */
export const noContentResponse = (res: Response): Response => {
    return res.status(204).send();
};

/**
 * Bad request response (400)
 */
export const badRequestResponse = (
    res: Response,
    message = 'Bad request',
    errors?: any[]
): Response => {
    return res.status(400).json(createErrorResponse(message, undefined, errors));
};

/**
 * Unauthorized response (401)
 */
export const unauthorizedResponse = (
    res: Response,
    message = 'Unauthorized'
): Response => {
    return res.status(401).json(createErrorResponse(message));
};

/**
 * Forbidden response (403)
 */
export const forbiddenResponse = (
    res: Response,
    message = 'Forbidden'
): Response => {
    return res.status(403).json(createErrorResponse(message));
};

/**
 * Not found response (404)
 */
export const notFoundResponse = (
    res: Response,
    message = 'Resource not found'
): Response => {
    return res.status(404).json(createErrorResponse(message));
};

/**
 * Conflict response (409)
 */
export const conflictResponse = (
    res: Response,
    message = 'Resource already exists'
): Response => {
    return res.status(409).json(createErrorResponse(message));
};

/**
 * Validation error response (422)
 */
export const validationErrorResponse = (
    res: Response,
    errors: any[],
    message = 'Validation failed'
): Response => {
    return res.status(422).json(createErrorResponse(message, undefined, errors));
};

/**
 * Too many requests response (429)
 */
export const tooManyRequestsResponse = (
    res: Response,
    message = 'Too many requests. Please try again later.'
): Response => {
    return res.status(429).json(createErrorResponse(message));
};

/**
 * Internal server error response (500)
 */
export const errorResponse = (
    res: Response,
    error: any,
    message = 'Internal server error'
): Response => {
    const errorMessage = error?.message || 'An unexpected error occurred';
    return res.status(500).json(createErrorResponse(message, errorMessage));
};