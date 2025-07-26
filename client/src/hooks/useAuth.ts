export function useAuth() {
  const user = localStorage.getItem("driiva_user");
  const userData = user ? JSON.parse(user) : null;
  
  return {
    user: userData,
    isAuthenticated: !!userData,
    userId: userData?.id || null,
  };
}