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
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const login = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast({
        title: "Success",
        description: "Logged in successfully",
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
    login.mutate(data);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#004990] via-[#0066cc] to-[#ffffff] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[1200px] grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:flex flex-col justify-center p-8 text-white">
          <Logo size="large" className="mb-8" />
          <h1 className="text-4xl font-bold mb-4">
            TRIPEXL
          </h1>
          <p className="text-lg opacity-90">
            AN Intelligent AI Platform for Seamless Journey Management
          </p>
        </div>

        <Card className="w-full max-w-[400px] mx-auto bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="md:hidden mb-6">
              <Logo className="mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-center">Login</h2>
            <p className="text-sm text-gray-500 text-center">
              Welcome back! Please login to your account
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter your email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
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
                              width="16"
                              height="16"
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
                      <div className="flex justify-end">
                        <Button
                          variant="link"
                          className="text-sm text-[#004990] p-0 h-auto font-normal"
                          onClick={() => setLocation("/auth/forgot-password")}
                        >
                          Forgot Password?
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-[#004990] hover:bg-[#003870]"
                  disabled={login.isPending}
                >
                  {login.isPending ? (
                    <div className="w-full flex justify-center">
                      <LoadingIndicator size="sm" />
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>
                <div className="text-center space-y-2">
                  <Button
                    variant="link"
                    className="text-sm text-[#004990]"
                    onClick={() => setLocation("/auth/register")}
                  >
                    Don't have an account? Register
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}