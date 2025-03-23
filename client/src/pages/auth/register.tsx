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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { WelcomeScreen } from "@/components/welcome-screen";

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
  const [showWelcomeScreen, setShowWelcomeScreen] = React.useState(false);
  const [userId, setUserId] = React.useState<number | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [passwordMatchError, setPasswordMatchError] = React.useState<string | null>(null);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      emailId: "",
      password: "",
      confirmPassword: "",
      userType: "EMPLOYEE",
      userOperationType: "STANDARD",
      userGroup: "GROUP_A",
    },
    mode: "onChange",
  });

  // Watch both password fields
  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");

  // Update password match validation in real-time
  React.useEffect(() => {
    if (confirmPassword && confirmPassword.length > 0) {
      if (password !== confirmPassword) {
        setPasswordMatchError("Passwords don't match");
      } else {
        setPasswordMatchError(null);
      }
    } else {
      setPasswordMatchError(null);
    }
  }, [password, confirmPassword]);

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
        title: "OTP Sent",
        description: `A verification code has been sent to your email address. Please check your inbox.`,
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
      setShowWelcomeScreen(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Verification failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    if (passwordMatchError) {
      return;
    }

    console.log('Form submitted with data:', { ...data, password: '[REDACTED]' });

    try {
      const { confirmPassword, ...registrationData } = data;
      const fullSubmitData = {
        ...registrationData,
        userName: `${data.firstName}.${data.lastName}`.toLowerCase(),
        fullName: `${data.firstName} ${data.lastName}`,
        userCode: `USR${Math.floor(1000 + Math.random() * 9000)}`,
      };

      console.log('Submitting registration data:', { ...fullSubmitData, password: '[REDACTED]' });
      register.mutate(fullSubmitData);
    } catch (error) {
      console.error('Error during form submission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Registration failed",
        variant: "destructive",
      });
    }
  };

  if (showWelcomeScreen) {
    return <WelcomeScreen />;
  }

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
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!userId) return;
              const formData = new FormData(e.currentTarget);
              const otp = formData.get("otp") as string;
              verify.mutate({ userId, otp });
            }} className="space-y-4">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name */}
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

            {/* Last Name */}
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

            {/* Email */}
            <FormField
              control={form.control}
              name="emailId"
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

            {/* Password */}
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
                      {showPassword ? "Hide" : "Show"}
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

            {/* Confirm Password */}
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
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </Button>
                  </div>
                  {passwordMatchError && (
                    <p className="text-sm font-medium text-destructive">{passwordMatchError}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={!!passwordMatchError || register.isPending}>
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