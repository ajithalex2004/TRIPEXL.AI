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
  otp: z.string().optional(),
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
    mutationFn: async (data: any) => {
      try {
        console.log("Creating user with data:", { ...data, password: '[REDACTED]' });
        const response = await apiRequest("POST", "/api/auth/register", data);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Registration failed:", errorData);
          throw new Error(errorData.message || "Failed to create account");
        }

        return response.json();
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Registration successful:", data);
      toast({
        title: "Verification Required",
        description: "A verification code has been sent to your email. Please check your inbox.",
        duration: 5000,
      });
      setUserId(data.userId);
      setVerificationStep(true);
    },
    onError: (error: any) => {
      console.error("Registration failed:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verify = useMutation({
    mutationFn: async ({ userId, otp }: { userId: number; otp: string }) => {
      try {
        console.log("Verifying OTP for user:", userId);
        const response = await apiRequest("POST", "/api/auth/verify", { userId, otp });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Invalid verification code");
        }

        return response.json();
      } catch (error) {
        console.error("OTP verification failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("OTP verification successful");
      localStorage.setItem("token", data.token);
      setShowWelcomeScreen(true);
    },
    onError: (error: any) => {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      if (passwordMatchError) {
        toast({
          title: "Invalid Password",
          description: "Please make sure your passwords match",
          variant: "destructive",
        });
        return;
      }

      const { confirmPassword, otp, ...registrationData } = data;
      const fullSubmitData = {
        ...registrationData,
        userName: `${data.firstName}.${data.lastName}`.toLowerCase(),
        fullName: `${data.firstName} ${data.lastName}`,
        userCode: `USR${Math.floor(1000 + Math.random() * 9000)}`,
      };

      await register.mutateAsync(fullSubmitData);
    } catch (error) {
      console.error("Form submission error:", error);
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
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!userId) {
              console.error("No userId available for verification");
              return;
            }
            const formData = new FormData(e.currentTarget);
            const otp = Array.from(formData.entries())
              .filter(([key]) => key.startsWith('otp-'))
              .map(([, value]) => value)
              .join('');

            console.log("Submitting OTP:", { userId, otp: '******' });
            verify.mutate({ userId, otp });
          }} className="space-y-4">
            <div className="space-y-2">
              <InputOTP maxLength={6} name="otp">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" className="w-full" disabled={verify.isPending}>
              {verify.isPending ? (
                <LoadingIndicator size="sm" />
              ) : (
                "Verify"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-[400px] mx-auto mt-8">
      <CardHeader>
        <h2 className="text-2xl font-bold">Create Account</h2>
        <p className="text-sm text-gray-500">
          Enter your details to register
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                    />
                  </FormControl>
                  <FormDescription>
                    Password must have at least 8 characters, one uppercase, one lowercase,
                    one number and one special character.
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
                  <FormControl>
                    <Input
                      {...field}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={register.isPending || !!passwordMatchError}
            >
              {register.isPending ? (
                <LoadingIndicator size="sm" />
              ) : (
                "Create Account"
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