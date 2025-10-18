import { VALIDATION } from './constants';

export const validateEmail = (email: string): boolean => {
  return VALIDATION.email.pattern.test(email);
};

export const validateUsername = (username: string): boolean => {
  if (
    username.length < VALIDATION.username.minLength ||
    username.length > VALIDATION.username.maxLength
  ) {
    return false;
  }
  return VALIDATION.username.pattern.test(username);
};

export const validatePassword = (password: string): boolean => {
  return (
    password.length >= VALIDATION.password.minLength &&
    password.length <= VALIDATION.password.maxLength
  );
};

export const validateCaption = (caption: string): boolean => {
  return caption.length <= VALIDATION.caption.maxLength;
};

export const validateBio = (bio: string): boolean => {
  return bio.length <= VALIDATION.bio.maxLength;
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getEmailError = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!validateEmail(email)) return 'Please enter a valid email';
  return null;
};

export const getUsernameError = (username: string): string | null => {
  if (!username) return 'Username is required';
  if (username.length < VALIDATION.username.minLength) {
    return `Username must be at least ${VALIDATION.username.minLength} characters`;
  }
  if (username.length > VALIDATION.username.maxLength) {
    return `Username must be less than ${VALIDATION.username.maxLength} characters`;
  }
  if (!VALIDATION.username.pattern.test(username)) {
    return 'Username can only contain letters, numbers, dots, and underscores';
  }
  return null;
};

export const getPasswordError = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < VALIDATION.password.minLength) {
    return `Password must be at least ${VALIDATION.password.minLength} characters`;
  }
  return null;
};

export const getCaptionError = (caption: string): string | null => {
  if (caption.length > VALIDATION.caption.maxLength) {
    return `Caption must be less than ${VALIDATION.caption.maxLength} characters`;
  }
  return null;
};

