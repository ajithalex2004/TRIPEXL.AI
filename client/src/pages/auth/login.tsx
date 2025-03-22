import * as React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Animation variants
  const logoVariants = {
    initial: {
      opacity: 0,
      scale: 0.3,
      y: 50,
      rotate: -10,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 1.2,
        bounce: 0.5,
      },
    },
    hover: {
      scale: 1.05,
      rotate: [0, -5, 5, -5, 0],
      transition: {
        duration: 1,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      },
    },
  };

  const form = useForm({
    defaultValues: {
      emailId: "",
      password: "",
    },
  });

  const login = useMutation({
    mutationFn: async (data: any) => {
      console.log('Attempting login with:', { emailId: data.emailId });
      const res = await apiRequest("POST", "/api/login", {
        emailId: data.emailId,
        password: data.password,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast({
        title: "Success",
        description: data.message || "Logged in successfully",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    console.log('Form submitted with:', data);
    login.mutate(data);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#004990] via-[#0066cc] to-[#ffffff] relative overflow-hidden">
      {/* Powered by text with animation */}
      <AnimatePresence>
        {isLoaded && (
          <>
            {/* Text on the left */}
            <motion.div
              className="absolute left-4 bottom-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.p
                className="text-sm font-medium text-black"
                whileHover={{ scale: 1.05 }}
              >
                Powered by EXL AI Solutions
              </motion.p>
            </motion.div>

            {/* Logo on the right */}
            <motion.div
              className="absolute right-4 bottom-4"
              variants={logoVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
            >
              <motion.img
                src="/images/exl-logo.png"
                alt="EXL Logo"
                className="w-[120px] h-auto object-contain"
                onLoad={() => setImageLoaded(true)}
                layoutId="logo"
                style={{ filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))" }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="container mx-auto h-screen flex flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-16 max-w-5xl">
          {/* Title and Description */}
          <motion.div
            className="flex-1 pl-8 flex flex-col justify-center min-w-[350px]"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.h1
              className="text-lg font-bold text-white tracking-wider whitespace-nowrap"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              TRIPXL - Enterprise Journey Management
            </motion.h1>
            <motion.p
              className="mt-2 text-sm text-white/90 max-w-sm leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              An Intelligent AI Platform for Seamless Journey Management
            </motion.p>
          </motion.div>

          {/* Sign In Form */}
          <motion.div
            className="w-full max-w-[450px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <motion.h2
              className="text-lg font-semibold text-white mb-3 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Welcome to TRIPXL
            </motion.h2>

            <Card className="backdrop-blur-sm bg-white/90 dark:bg-black/50 border border-white/20 px-5 py-4">
              <CardHeader className="space-y-2 pb-3">
                <h2 className="text-xl font-semibold text-center">Sign In</h2>
                <p className="text-sm text-muted-foreground text-center">
                  Enter your credentials to continue
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={onSubmit} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="emailId"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-base">Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                              className="text-base px-3 py-2"
                            />
                          </FormControl>
                          <FormMessage className="text-sm"/>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-base">Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="text-base px-3 py-2"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-4 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </Button>
                          </div>
                          <FormMessage className="text-sm"/>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#004990] to-[#0066cc] hover:from-[#003870] hover:to-[#004990] text-white py-3 text-lg"
                      disabled={login.isPending}
                    >
                      {login.isPending ? (
                        <LoadingIndicator className="mr-2" />
                      ) : null}
                      {login.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                    <div className="text-center mt-4">
                      <div className="flex flex-col space-y-3">
                        <Button
                          variant="link"
                          className="text-base text-[#004990] hover:text-[#003870]"
                          onClick={() => setLocation("/auth/register")}
                        >
                          Don't have an account? Register here
                        </Button>
                        <Button
                          variant="link"
                          className="text-base text-[#004990] hover:text-[#003870]"
                          onClick={() => setLocation("/auth/forgot-password")}
                        >
                          Forgot Password?
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}