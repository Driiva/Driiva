import { User, LoginCredentials } from '@shared/types';

// Auth utilities with proper error handling
export const authenticate = async (credentials: LoginCredentials): Promise<User> => {
  // Validate inputs
  if (!credentials.username || !credentials.password) {
    throw new Error('Username and password are required');
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid username or password');
    }

    const user = await response.json();
    return user;
  } catch (error: any) {
    // Re-throw with more specific error messages
    if (error.message.includes('Too many')) {
      throw new Error('Too many authentication attempts. Please try again later.');
    }
    throw error;
  }
};

export const validateToken = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    // Add token validation logic here
    return true;
  } catch {
    return false;
  }
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};