/**
 * Legacy login page — redirects to /signin.
 * App.tsx maps /login → SignIn component directly; this file is a fallback.
 */
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Login() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation('/signin');
  }, [setLocation]);
  return null;
}
