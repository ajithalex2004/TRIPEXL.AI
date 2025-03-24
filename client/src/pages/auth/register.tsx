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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { WelcomeScreen } from "@/components/welcome-screen";
import { Alert, AlertDescription } from "@/components/ui/alert";

const registerSchema = insertUserSchema.extend({
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Test toast on component mount
  React.useEffect(() => {
    console.log("Testing register page toast...");
    toast({
      title: "Register Page Loaded",
      description: "Toast test from register page"
    });
  }, [toast]);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email_id: "",
      password: "",
      confirm_password: "",
      user_type: "USER",
      user_operation_type: "EMPLOYEE",
      user_group: "GROUP_A",
      user_name: "",
      user_code: "",
      full_name: "",
      is_active: true
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      try {
        setError(null);
        console.log("Starting registration mutation");
        const { confirm_password, ...formData } = data;

        // Test toast during mutation
        toast({
          title: "Processing",
          description: "Processing registration..."
        });

        const registrationData = {
          ...formData,
          user_name: `${data.first_name}.${data.last_name}`.toLowerCase(),
          user_code: `USR${Math.floor(1000 + Math.random() * 9000)}`,
          full_name: `${data.first_name} ${data.last_name}`,
        };

        console.log("Sending registration request with data:", {
          ...registrationData,
          password: '[REDACTED]'
        });

        const response = await apiRequest("POST", "/api/auth/register", registrationData);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Registration API error:", errorData);
          throw new Error(errorData.message || "Failed to register");
        }

        const result = await response.json();
        console.log("Registration API success:", result);
        return result;
      } catch (error) {
        console.error("Registration mutation error:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unexpected error occurred");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Registration mutation success callback", data);
      // Test immediate toast
      toast({
        title: "Success!",
        description: "Your account has been created successfully."
      });
      setShowWelcome(true);
    },
    onError: (error: Error) => {
      console.log("Registration mutation error callback:", error);
      // Test immediate toast
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    },
  });

  const onSubmit = async (formData: RegisterFormData) => {
    try {
      console.log("Form submission started");
      // Test immediate toast
      toast({
        title: "Form Submitted",
        description: "Processing your registration..."
      });
      await registerMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return (
    <Card className="w-[400px] mx-auto mt-8">
      <CardHeader>
        <h2 className="text-2xl font-bold">Create Account</h2>
        <p className="text-sm text-muted-foreground">Enter your details to register</p>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
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
              name="last_name"
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
              name="email_id"
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
                    <Input {...field} type="password" placeholder="Create a strong password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Confirm your password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <LoadingIndicator className="mr-2" />
                  Creating Account...
                </>
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