export function useAuth() {
  const user = localStorage.getItem("driiva_user");
  const userData = user ? JSON.parse(user) : null;
  
  return {
    user: userData,
    isAuthenticated: !!userData,
    userId: userData?.id || null,
  };
}
import { useContext } from 'react';
import { AuthContext } from '../App';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default useAuth;
