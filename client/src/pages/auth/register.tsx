import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

// Enhanced registration schema with password requirements
const registrationSchema = insertUserSchema.extend({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [verificationStep, setVerificationStep] = React.useState(false);
  const [userId, setUserId] = React.useState<number | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(verificationStep ? z.object({ otp: z.string() }) : registrationSchema),
    defaultValues: verificationStep ? {
      otp: "",
    } : {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  const register = useMutation({
    mutationFn: async (data: Omit<RegistrationFormData, "confirmPassword">) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration successful",
        description: `Your verification code is: ${data.otp}. This code has also been sent to your email.`,
        duration: 10000,
      });
      setUserId(data.userId);
      setVerificationStep(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    },
  });

  const verify = useMutation({
    mutationFn: async (data: { userId: number; otp: string }) => {
      const res = await apiRequest("POST", "/api/auth/verify", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Verification failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast({
        title: "Success",
        description: "Account verified successfully",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Verification failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    if (!verificationStep) {
      const { confirmPassword, ...registrationData } = data;
      register.mutate(registrationData);
    } else if (userId) {
      verify.mutate({ userId, otp: data.otp });
    }
  });

  if (verificationStep) {
    return (
      <Card className="w-[400px] mx-auto mt-8">
        <CardHeader>
          <h2 className="text-2xl font-bold">Verify Your Account</h2>
          <p className="text-sm text-gray-500">
            Please enter the verification code sent to your email
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter the code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={verify.isPending}>
                {verify.isPending ? (
                  <div className="w-full flex justify-center">
                    <LoadingIndicator size="sm" />
                  </div>
                ) : (
                  "Verify"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-[400px] mx-auto mt-8">
      <CardHeader>
        <h2 className="text-2xl font-bold">New User Registration</h2>
        <p className="text-sm text-gray-500">
          Create your account
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your first name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your last name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                        type={showPassword ? "text" : "password"}
                        {...field}
                        placeholder="Create a password"
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
                  <FormDescription className="text-xs">
                    Password must:
                    <ul className="list-disc list-inside">
                      <li>Be at least 8 characters long</li>
                      <li>Contain at least one uppercase letter</li>
                      <li>Contain at least one lowercase letter</li>
                      <li>Contain at least one number</li>
                      <li>Contain at least one special character</li>
                    </ul>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        {...field}
                        placeholder="Confirm your password"
                        onChange={(e) => {
                          field.onChange(e);
                          // Get current password value
                          const password = form.getValues("password");
                          // Show error immediately if passwords don't match
                          if (e.target.value && e.target.value !== password) {
                            form.setError("confirmPassword", {
                              type: "manual",
                              message: "Passwords don't match"
                            });
                          } else {
                            form.clearErrors("confirmPassword");
                          }
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending ? (
                <div className="w-full flex justify-center">
                  <LoadingIndicator size="sm" />
                </div>
              ) : (
                "Register"
              )}
            </Button>
            <div className="text-center">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => setLocation("/auth/login")}
              >
                Already have an account? Login
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}