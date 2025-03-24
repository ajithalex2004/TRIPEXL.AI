import * as React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface LoginFormData {
  email_id: string;
  password: string;
}

export default function LoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormData>({
    defaultValues: {
      email_id: "",
      password: "",
    },
  });

  const login = useMutation({
    mutationFn: async (data: LoginFormData) => {
      console.log('Attempting login with:', { email_id: data.email_id });
      try {
        const res = await apiRequest("POST", "/api/auth/login", data);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Login failed");
        }
        return res.json();
      } catch (error) {
        console.error('Login API error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Login successful:', data);
      localStorage.setItem("token", data.token);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      console.error('Login error:', error);
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
      <div className="container mx-auto h-screen flex flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-16 max-w-5xl">
          <motion.div
            className="flex-1 pl-8 flex flex-col justify-center min-w-[350px]"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.h1
              className="text-base font-bold text-white tracking-wider whitespace-nowrap"
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

          <motion.div
            className="w-full max-w-[350px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-black/50 border border-white/20 px-3 py-2">
              <CardHeader className="space-y-1 pb-2">
                <h2 className="text-base font-semibold text-center">Sign In</h2>
                <p className="text-xs text-muted-foreground text-center">
                  Enter your credentials to continue
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={onSubmit} className="space-y-2">
                    <FormField
                      control={form.control}
                      name="email_id"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-sm">Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                              className="text-xs px-2 py-1"
                            />
                          </FormControl>
                          <FormMessage className="text-xs"/>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-sm">Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="text-xs px-2 py-1"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-1.5 py-1 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
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
                                  width="14"
                                  height="14"
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
                          <FormMessage className="text-xs"/>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#004990] to-[#0066cc] hover:from-[#003870] hover:to-[#004990] text-white py-1.5 text-sm"
                      disabled={login.isPending}
                    >
                      {login.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
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