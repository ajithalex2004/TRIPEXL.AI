import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, UserType, UserOperationType, UserGroup } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Registration schema matches insertUserSchema from shared/schema.ts
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
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      user_name: "",
      user_code: "",
      user_type: UserType.USER,
      email_id: "",
      user_operation_type: UserOperationType.EMPLOYEE,
      user_group: UserGroup.GROUP_A,
      full_name: "",
      first_name: "",
      last_name: "",
      password: "",
      is_active: true,
      confirm_password: ""
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      try {
        setNotification({ type: null, message: '' });
        console.log("Starting registration process...");

        const { confirm_password, ...formData } = data;

        // Transform data to match schema
        const registrationData = {
          ...formData,
          user_name: `${data.first_name}.${data.last_name}`.toLowerCase(),
          user_code: `USR${Math.floor(1000 + Math.random() * 9000)}`,
          full_name: `${data.first_name} ${data.last_name}`
        };

        console.log("Sending registration request...");
        const response = await apiRequest("POST", "/api/auth/register", registrationData);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Registration failed");
        }

        const result = await response.json();
        console.log("Registration successful!", result);
        return result;
      } catch (error) {
        console.error("Registration failed:", error);
        if (error instanceof Error) {
          setNotification({ type: 'error', message: error.message });
        } else {
          setNotification({ type: 'error', message: "An unexpected error occurred" });
        }
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Setting success notification");
      setNotification({
        type: 'success',
        message: 'Account created successfully!'
      });
      setShowWelcome(true);
    },
    onError: (error: Error) => {
      console.log("Setting error notification");
      setNotification({
        type: 'error',
        message: error.message || "Failed to create account"
      });
    },
  });

  const onSubmit = async (formData: RegisterFormData) => {
    try {
      console.log("Form submitted with data:", {
        ...formData,
        password: '[REDACTED]',
        confirm_password: '[REDACTED]'
      });
      setNotification({
        type: 'success',
        message: 'Processing registration...'
      });
      await registerMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Submit handler error:", error);
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
        {notification.type && (
          <Alert 
            variant={notification.type === 'error' ? "destructive" : "default"} 
            className="mb-4"
          >
            <AlertDescription>{notification.message}</AlertDescription>
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
              name="user_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(UserType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_operation_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select operation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(UserOperationType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_group"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Group</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(UserGroup).map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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