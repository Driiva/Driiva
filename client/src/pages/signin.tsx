import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import DriivaLogo from "@/components/DrivvaLogo";
import FloatingStardust from "@/components/FloatingStardust";
import { useParallax } from "@/hooks/useParallax";
import { useAuth } from "../contexts/AuthContext";
import BiometricAuth from "@/components/BiometricAuth";

export default function SignIn() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("driiva1");
  const [password, setPassword] = useState("driiva1");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { ref: cardRef, style: cardParallaxStyle } = useParallax({ speed: 0.3 });
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Missing credentials",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Try real authentication first
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        login(userData);
        
        toast({
          title: "Welcome back!",
          description: `Signed in as ${userData.firstName || userData.username}`,
        });
        
        setLocation("/dashboard");
      } else {
        // Fallback to demo authentication
        if (username === "driiva1" && password === "driiva1") {
          const userData = {
            id: 8,
            username: "driiva1",
            firstName: "Test",
            lastName: "Driver",
            email: "test@driiva.com",
            premiumAmount: "1840.00"
          };
          
          login(userData);
          
          toast({
            title: "Welcome back!",
            description: `Signed in as ${userData.firstName}`,
          });
          
          setLocation("/dashboard");
        } else {
          throw new Error('Invalid credentials');
        }
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricSuccess = (userData: any) => {
    login(userData);
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Enhanced Floating Stardust Background */}
      <FloatingStardust density={150} />
      
      {/* Driiva Logo Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="scale-[8] blur-[2px]" style={{
          filter: 'blur(4px) brightness(0.3)',
        }}>
          <DriivaLogo />
        </div>
      </div>

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 30% 20%, rgba(139, 69, 19, 0.15) 0%, rgba(184, 115, 51, 0.1) 35%, rgba(123, 31, 162, 0.08) 70%, transparent 100%)',
        backdropFilter: 'blur(1px)',
      }} />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            delay: 0.2,
          }}
        >
          <Card 
            ref={cardRef}
            className="w-full max-w-md mx-auto parallax-content" 
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              ...cardParallaxStyle,
            }}>
            <CardContent className="p-4">
              {/* Logo */}
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    delay: 0.4,
                  }}
                >
                  <DriivaLogo />
                </motion.div>
              </div>

              {/* Welcome Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center mb-4"
              >
                <h1 className="text-2xl font-bold mb-2" style={{ 
                  fontFamily: 'Inter, sans-serif',
                  textShadow: '1px 1px 3px rgba(0,0,0,0.6)'
                }}>
                  Welcome to Driiva
                </h1>
                <p className="text-sm text-white/80" style={{ 
                  fontFamily: 'Inter, sans-serif',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  Sign in to your telematics insurance account
                </p>
              </motion.div>

              {/* Biometric Authentication */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-4"
              >
                <BiometricAuth
                  username={username}
                  onSuccess={handleBiometricSuccess}
                />
              </motion.div>

              {/* Sign In Form */}
              <motion.form
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onSubmit={handleSubmit}
                className="space-y-3"
              >
                {/* Username Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90" style={{ 
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50"
                      style={{
                        backdropFilter: 'blur(10px)',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/90" style={{ 
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-white/50"
                      style={{
                        backdropFilter: 'blur(10px)',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Demo Account Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="text-center p-2 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <p className="text-xs text-white/70" style={{ 
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Demo Account: <span className="font-mono text-white/90">driiva1 / driiva1</span>
                  </p>
                </motion.div>

                {/* Sign In Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#8B4513] via-[#B87333] to-[#7B1FA2] hover:from-[#A0522D] hover:via-[#CD853F] hover:to-[#8B5A96] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                    style={{
                      boxShadow: '0 8px 32px rgba(139, 69, 19, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}