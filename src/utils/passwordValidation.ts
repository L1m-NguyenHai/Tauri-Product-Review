// Password validation utilities

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export const validatePassword = (password: string): PasswordValidation => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  const errors: string[] = [];

  if (!requirements.minLength) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!requirements.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!requirements.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!requirements.hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
  }

  return {
    isValid: Object.values(requirements).every(req => req),
    errors,
    requirements,
  };
};

export const getPasswordStrengthColor = (validation: PasswordValidation): string => {
  const validCount = Object.values(validation.requirements).filter(req => req).length;
  
  if (validCount === 5) return 'text-green-600';
  if (validCount >= 3) return 'text-yellow-600';
  return 'text-red-600';
};

export const getPasswordStrengthText = (validation: PasswordValidation): string => {
  const validCount = Object.values(validation.requirements).filter(req => req).length;
  
  if (validCount === 5) return 'Strong';
  if (validCount >= 3) return 'Medium';
  return 'Weak';
};