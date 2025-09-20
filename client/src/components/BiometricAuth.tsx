/**
 * Biometric Authentication Component
 * Provides Face ID/Touch ID authentication interface
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { checkBiometricSupport, authenticateWithBiometrics, registerBiometricCredential } from "@/lib/webauthn";
import { Smartphone, ShieldCheck, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface BiometricAuthProps {
  username: string;
  onSuccess: (userData: any) => void;
  onRegister?: () => void;
}

export default function BiometricAuth({ username, onSuccess, onRegister }: BiometricAuthProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [supportDetails, setSupportDetails] = useState<{
    supported: boolean;
    platformAuthenticator: boolean;
    error?: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkSupport();
    if (username) {
      checkUserCredentials();
    }
  }, [username]);

  const checkSupport = async () => {
    const support = await checkBiometricSupport();
    setSupportDetails(support);
    setIsSupported(support.supported && support.platformAuthenticator);
  };

  const checkUserCredentials = async () => {
    try {
      const response = await fetch(`/api/auth/webauthn/credentials/${username}`);
      if (response.ok) {
        const data = await response.json();
        setHasCredentials(data.credentials.length > 0);
      }
    } catch (error) {
      console.error('Error checking credentials:', error);
    }
  };

  const handleBiometricAuth = async () => {
    if (!username) {
      toast({
        title: "Username Required",
        description: "Please enter your username first",
        variant: "destructive",
      });
      return;
    }

    setIsAuthenticating(true);
    
    try {
      const result = await authenticateWithBiometrics(username);
      
      if (result.success && result.user) {
        onSuccess(result.user);
        toast({
          title: "Welcome back!",
          description: "Authenticated with biometrics",
        });
      } else {
        throw new Error(result.error || "Authentication failed");
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Could not authenticate with biometrics",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleBiometricRegistration = async () => {
    if (!username) {
      toast({
        title: "Username Required", 
        description: "Please enter your username first",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    
    try {
      const result = await registerBiometricCredential(username);
      
      if (result.success) {
        setHasCredentials(true);
        toast({
          title: "Registration Successful!",
          description: "Face ID/Touch ID has been enabled for your account",
        });
        if (onRegister) onRegister();
      } else {
        throw new Error(result.error || "Registration failed");
      }
    } catch (error: any) {
      console.error('Biometric registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Could not register biometric authentication",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const getDeviceIcon = () => {
    return <ShieldCheck className="w-6 h-6" />;
  };

  const getDeviceLabel = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return 'Face ID';
    } else if (userAgent.includes('Mac')) {
      return 'Touch ID';
    } else {
      return 'Biometric';
    }
  };

  if (!isSupported || !supportDetails?.platformAuthenticator) {
    return (
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20"
        >
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <div className="text-sm text-amber-200">
            {supportDetails?.error || "Biometric authentication not available on this device"}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Biometric Authentication Button */}
      {hasCredentials ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={handleBiometricAuth}
            disabled={isAuthenticating || !username}
            className="w-full h-14 bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-600 border-0 text-white font-medium transition-all duration-300"
            data-testid="button-biometric-auth"
          >
            <div className="flex items-center gap-3">
              {isAuthenticating ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                getDeviceIcon()
              )}
              <span>{isAuthenticating ? 'Authenticating...' : `Sign in with ${getDeviceLabel()}`}</span>
            </div>
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <Button
            onClick={handleBiometricRegistration}
            disabled={isRegistering || !username}
            variant="outline"
            className="w-full h-14 bg-white/5 border-white/20 hover:bg-white/10 text-white font-medium transition-all duration-300"
            data-testid="button-biometric-register"
          >
            <div className="flex items-center gap-3">
              {isRegistering ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                getDeviceIcon()
              )}
              <span>{isRegistering ? 'Setting up...' : `Set up ${getDeviceLabel()}`}</span>
            </div>
          </Button>
          
          <p className="text-xs text-white/60 text-center">
            Enable biometric authentication for faster, more secure login
          </p>
        </motion.div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <span className="text-xs text-white/50 font-medium">OR</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
}