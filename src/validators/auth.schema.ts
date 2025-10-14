import { z } from 'zod';
import env from '../config/env';

/**
 * Password validation regex
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * Phone number validation (UAE format)
 * Supports: +971XXXXXXXXX, 971XXXXXXXXX, 05XXXXXXXX, 5XXXXXXXX
 */
const phoneRegex = /^(\+971|971|0)?[1-9][0-9]{8}$/;

/**
 * Emirates ID validation
 * Format: 784-YYYY-XXXXXXX-X
 */
const emiratesIdRegex = /^784-\d{4}-\d{7}-\d{1}$/;

/**
 * Step 1: Personal Information Schema
 */
export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces')
    .transform((val) => val.trim()),
  
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .transform((val) => val.trim()),
  
  phoneNumber: z
    .string()
    .regex(phoneRegex, 'Invalid UAE phone number format')
    .transform((val) => {
      // Normalize to +971 format
      let normalized = val.replace(/\s/g, '');
      if (normalized.startsWith('05')) {
        normalized = '+971' + normalized.substring(1);
      } else if (normalized.startsWith('5')) {
        normalized = '+971' + normalized;
      } else if (normalized.startsWith('971')) {
        normalized = '+' + normalized;
      } else if (!normalized.startsWith('+971')) {
        normalized = '+971' + normalized;
      }
      return normalized;
    }),
  
  password: z
    .string()
    .min(env.PASSWORD_MIN_LENGTH, `Password must be at least ${env.PASSWORD_MIN_LENGTH} characters`)
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

/**
 * Step 2: Business Location Schema
 */
export const businessLocationSchema = z.object({
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address must not exceed 255 characters')
    .transform((val) => val.trim()),
  
  street: z
    .string()
    .min(3, 'Street must be at least 3 characters')
    .max(100, 'Street must not exceed 100 characters')
    .transform((val) => val.trim()),
  
  state: z
    .string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State must not exceed 50 characters')
    .transform((val) => val.trim()),
  
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must not exceed 100 characters')
    .transform((val) => val.trim()),
  
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
});

/**
 * Step 3: Business Details Schema
 */
export const businessDetailsSchema = z.object({
  companyLegalName: z
    .string()
    .min(3, 'Company legal name must be at least 3 characters')
    .max(255, 'Company legal name must not exceed 255 characters')
    .transform((val) => val.trim()),
  
  emiratesIdUrl: z
    .string()
    .url('Invalid Emirates ID file URL')
    .or(z.string().min(1, 'Emirates ID document is required')),
  
  tradeLicenseNumber: z
    .string()
    .min(5, 'Trade license number must be at least 5 characters')
    .max(50, 'Trade license number must not exceed 50 characters')
    .transform((val) => val.trim().toUpperCase()),
  
  vatCertification: z
    .string()
    .max(50, 'VAT certification must not exceed 50 characters')
    .transform((val) => val.trim().toUpperCase())
    .optional()
    .or(z.literal('')),
});

/**
 * Step 4: Verification Code Schema
 */
export const verificationCodeSchema = z.object({
  code: z
    .string()
    .length(env.OTP_LENGTH, `Verification code must be ${env.OTP_LENGTH} digits`)
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
  
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .optional(),
  
  phoneNumber: z
    .string()
    .regex(phoneRegex, 'Invalid phone number')
    .optional(),
});

/**
 * Login Schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .transform((val) => val.trim()),
  
  password: z
    .string()
    .min(1, 'Password is required'),
});

/**
 * Resend Verification Code Schema
 */
export const resendCodeSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .optional(),
  
  phoneNumber: z
    .string()
    .regex(phoneRegex, 'Invalid phone number')
    .optional(),
}).refine(
  (data) => data.email || data.phoneNumber,
  {
    message: 'Either email or phone number is required',
  }
);

/**
 * Complete Registration Schema
 */
export const completeRegistrationSchema = personalInfoSchema
  .merge(businessLocationSchema)
  .merge(businessDetailsSchema);

/**
 * Export types
 */
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type BusinessLocationInput = z.infer<typeof businessLocationSchema>;
export type BusinessDetailsInput = z.infer<typeof businessDetailsSchema>;
export type VerificationCodeInput = z.infer<typeof verificationCodeSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>;
