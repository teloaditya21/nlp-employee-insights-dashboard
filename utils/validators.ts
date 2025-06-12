/**
 * @fileoverview Validation utilities
 * @description Utility functions for form validation and data validation
 */

import { VALIDATION_RULES, REGEX_PATTERNS } from './constants';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validate email address
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email is required' };
  }

  const trimmedEmail = email.trim();
  
  if (!REGEX_PATTERNS.EMAIL.test(trimmedEmail)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

/**
 * Validate password
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }

  const { MIN_LENGTH, MAX_LENGTH, REQUIRE_UPPERCASE, REQUIRE_LOWERCASE, REQUIRE_NUMBERS } = VALIDATION_RULES.PASSWORD;

  if (password.length < MIN_LENGTH) {
    return { isValid: false, message: `Password must be at least ${MIN_LENGTH} characters long` };
  }

  if (password.length > MAX_LENGTH) {
    return { isValid: false, message: `Password must not exceed ${MAX_LENGTH} characters` };
  }

  if (REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (REQUIRE_NUMBERS && !/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  return { isValid: true };
};

/**
 * Validate username
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, message: 'Username is required' };
  }

  const trimmedUsername = username.trim();
  const { MIN_LENGTH, MAX_LENGTH, PATTERN } = VALIDATION_RULES.USERNAME;

  if (trimmedUsername.length < MIN_LENGTH) {
    return { isValid: false, message: `Username must be at least ${MIN_LENGTH} characters long` };
  }

  if (trimmedUsername.length > MAX_LENGTH) {
    return { isValid: false, message: `Username must not exceed ${MAX_LENGTH} characters` };
  }

  if (!PATTERN.test(trimmedUsername)) {
    return { isValid: false, message: 'Username can only contain letters, numbers, dots, hyphens, and underscores' };
  }

  return { isValid: true };
};

/**
 * Validate required field
 */
export const validateRequired = (value: any, fieldName: string = 'Field'): ValidationResult => {
  if (value === null || value === undefined) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, message: `${fieldName} is required` };
  }

  if (Array.isArray(value) && value.length === 0) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  return { isValid: true };
};

/**
 * Validate string length
 */
export const validateLength = (
  value: string,
  minLength: number,
  maxLength?: number,
  fieldName: string = 'Field'
): ValidationResult => {
  if (!value || typeof value !== 'string') {
    return { isValid: false, message: `${fieldName} is required` };
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length < minLength) {
    return { isValid: false, message: `${fieldName} must be at least ${minLength} characters long` };
  }

  if (maxLength && trimmedValue.length > maxLength) {
    return { isValid: false, message: `${fieldName} must not exceed ${maxLength} characters` };
  }

  return { isValid: true };
};

/**
 * Validate number range
 */
export const validateNumberRange = (
  value: number,
  min?: number,
  max?: number,
  fieldName: string = 'Value'
): ValidationResult => {
  if (typeof value !== 'number' || isNaN(value)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }

  if (min !== undefined && value < min) {
    return { isValid: false, message: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && value > max) {
    return { isValid: false, message: `${fieldName} must not exceed ${max}` };
  }

  return { isValid: true };
};

/**
 * Validate URL
 */
export const validateUrl = (url: string): ValidationResult => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, message: 'URL is required' };
  }

  const trimmedUrl = url.trim();

  if (!REGEX_PATTERNS.URL.test(trimmedUrl)) {
    return { isValid: false, message: 'Please enter a valid URL' };
  }

  try {
    new URL(trimmedUrl);
    return { isValid: true };
  } catch {
    return { isValid: false, message: 'Please enter a valid URL' };
  }
};

/**
 * Validate phone number
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, message: 'Phone number is required' };
  }

  const trimmedPhone = phone.trim();

  if (!REGEX_PATTERNS.PHONE.test(trimmedPhone)) {
    return { isValid: false, message: 'Please enter a valid phone number' };
  }

  // Remove all non-digit characters for length validation
  const digits = trimmedPhone.replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 15) {
    return { isValid: false, message: 'Phone number must be between 10 and 15 digits' };
  }

  return { isValid: true };
};

/**
 * Validate date
 */
export const validateDate = (date: string | Date, fieldName: string = 'Date'): ValidationResult => {
  if (!date) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: `Please enter a valid ${fieldName.toLowerCase()}` };
  }

  return { isValid: true };
};

/**
 * Validate date range
 */
export const validateDateRange = (
  startDate: string | Date,
  endDate: string | Date
): ValidationResult => {
  const startValidation = validateDate(startDate, 'Start date');
  if (!startValidation.isValid) {
    return startValidation;
  }

  const endValidation = validateDate(endDate, 'End date');
  if (!endValidation.isValid) {
    return endValidation;
  }

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (start > end) {
    return { isValid: false, message: 'Start date must be before end date' };
  }

  return { isValid: true };
};

/**
 * Validate file
 */
export const validateFile = (
  file: File,
  allowedTypes?: string[],
  maxSize?: number
): ValidationResult => {
  if (!file) {
    return { isValid: false, message: 'File is required' };
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }

  if (maxSize && file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { 
      isValid: false, 
      message: `File size must not exceed ${maxSizeMB}MB` 
    };
  }

  return { isValid: true };
};

/**
 * Validate search query
 */
export const validateSearchQuery = (query: string): ValidationResult => {
  if (!query || typeof query !== 'string') {
    return { isValid: false, message: 'Search query is required' };
  }

  const trimmedQuery = query.trim();
  const { MIN_LENGTH, MAX_LENGTH } = VALIDATION_RULES.SEARCH;

  if (trimmedQuery.length < MIN_LENGTH) {
    return { isValid: false, message: `Search query must be at least ${MIN_LENGTH} characters long` };
  }

  if (trimmedQuery.length > MAX_LENGTH) {
    return { isValid: false, message: `Search query must not exceed ${MAX_LENGTH} characters` };
  }

  return { isValid: true };
};

/**
 * Validate array of values
 */
export const validateArray = (
  values: any[],
  minLength?: number,
  maxLength?: number,
  fieldName: string = 'Items'
): ValidationResult => {
  if (!Array.isArray(values)) {
    return { isValid: false, message: `${fieldName} must be an array` };
  }

  if (minLength !== undefined && values.length < minLength) {
    return { isValid: false, message: `Must select at least ${minLength} ${fieldName.toLowerCase()}` };
  }

  if (maxLength !== undefined && values.length > maxLength) {
    return { isValid: false, message: `Cannot select more than ${maxLength} ${fieldName.toLowerCase()}` };
  }

  return { isValid: true };
};

/**
 * Validate object with multiple fields
 */
export const validateObject = (
  obj: Record<string, any>,
  validators: Record<string, (value: any) => ValidationResult>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(validators)) {
    const result = validator(obj[field]);
    if (!result.isValid) {
      errors[field] = result.message || 'Invalid value';
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Create a custom validator function
 */
export const createValidator = (
  validationFn: (value: any) => boolean,
  errorMessage: string
) => {
  return (value: any): ValidationResult => {
    if (validationFn(value)) {
      return { isValid: true };
    }
    return { isValid: false, message: errorMessage };
  };
};

/**
 * Combine multiple validators
 */
export const combineValidators = (
  ...validators: Array<(value: any) => ValidationResult>
) => {
  return (value: any): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
};

/**
 * Validate sentiment type
 */
export const validateSentiment = (sentiment: string): ValidationResult => {
  const validSentiments = ['positive', 'negative', 'neutral', 'all'];
  
  if (!sentiment || typeof sentiment !== 'string') {
    return { isValid: false, message: 'Sentiment is required' };
  }

  if (!validSentiments.includes(sentiment)) {
    return { isValid: false, message: 'Invalid sentiment type' };
  }

  return { isValid: true };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page: number, pageSize: number): ValidationResult => {
  if (typeof page !== 'number' || page < 1) {
    return { isValid: false, message: 'Page must be a positive number' };
  }

  if (typeof pageSize !== 'number' || pageSize < 1 || pageSize > 100) {
    return { isValid: false, message: 'Page size must be between 1 and 100' };
  }

  return { isValid: true };
};
