/**
 * Garage Registration Types
 * Defines all data structures for the multi-step garage registration process
 */

export enum UserRole {
  GARAGE_OWNER = 'garage_owner',
  ADMIN = 'admin',
  MOBILE_USER = 'mobile_user',
}

export enum RegistrationStatus {
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum VerificationMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  BOTH = 'both',
}

/**
 * Step 1: Personal Information
 */
export interface PersonalInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

/**
 * Step 2: Business Location
 */
export interface BusinessLocation {
  address: string;
  street: string;
  state: string;
  location: string; // Could be city or specific location
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Step 3: Business Details
 */
export interface BusinessDetails {
  companyLegalName: string;
  emiratesId: string; // File path/URL after upload
  tradeLicenseNumber: string;
  vatCertification?: string; // Optional
}

/**
 * Complete Garage Profile
 */
export interface GarageProfile {
  id: string;
  userId: string;
  
  // Personal Information
  fullName: string;
  email: string;
  phoneNumber: string;
  
  // Business Location
  address: string;
  street: string;
  state: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  // Business Details
  companyLegalName: string;
  emiratesIdUrl: string;
  tradeLicenseNumber: string;
  vatCertification?: string;
  
  // Status and Metadata
  role: UserRole;
  status: RegistrationStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  
  // Security
  failedLoginAttempts: number;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User table (Authentication)
 */
export interface User {
  id: string;
  email: string;
  password: string; // Hashed
  role: UserRole;
  status: RegistrationStatus;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Registration session for multi-step process
 */
export interface RegistrationSession {
  id: string;
  sessionToken: string;
  email: string;
  phoneNumber?: string;
  
  // Step completion flags
  step1Completed: boolean;
  step2Completed: boolean;
  step3Completed: boolean;
  step4Completed: boolean;
  
  // Temporary data storage
  personalInfo?: PersonalInfo;
  businessLocation?: BusinessLocation;
  businessDetails?: BusinessDetails;
  
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Verification codes (OTP)
 */
export interface VerificationCode {
  id: string;
  userId?: string;
  email?: string;
  phoneNumber?: string;
  code: string;
  method: VerificationMethod;
  attempts: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * File uploads tracking
 */
export interface FileUpload {
  id: string;
  userId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  publicUrl: string;
  uploadType: 'emirates_id' | 'trade_license' | 'vat_certificate' | 'other';
  createdAt: Date;
}
