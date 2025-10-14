import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createErrorResponse } from '../utils/responses';
import logger from '../config/logger';

/**
 * Middleware to validate request body using Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate and transform the request body
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                logger.warn('Validation error:', { errors, body: req.body });

                return res.status(400).json(
                    createErrorResponse(
                        'Validation failed',
                        errors.map((e) => e.message).join(', '),
                        errors
                    )
                );
            }

            logger.error('Unexpected validation error:', error);
            return res.status(500).json(
                createErrorResponse('Internal server error', 'An unexpected error occurred')
            );
        }
    };
};

/**
 * Middleware to validate request query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.query = await schema.parseAsync(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                return res.status(400).json(
                    createErrorResponse(
                        'Query validation failed',
                        errors.map((e) => e.message).join(', '),
                        errors
                    )
                );
            }

            return res.status(500).json(
                createErrorResponse('Internal server error', 'An unexpected error occurred')
            );
        }
    };
};

/**
 * Middleware to validate request params
 */
export const validateParams = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.params = await schema.parseAsync(req.params);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                return res.status(400).json(
                    createErrorResponse(
                        'Parameter validation failed',
                        errors.map((e) => e.message).join(', '),
                        errors
                    )
                );
            }

            return res.status(500).json(
                createErrorResponse('Internal server error', 'An unexpected error occurred')
            );
        }
    };
};