import * as React from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email_id: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email_id: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log("Attempting login with:", data.email_id);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      console.log("Server response:", response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to login");
      }

      // Store token and redirect
      localStorage.setItem("token", responseData.token);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      setLocation("/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#004990] via-[#0066cc] to-[#ffffff] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <h2 className="text-2xl font-bold text-center">Sign In</h2>
          <p className="text-sm text-muted-foreground text-center">
            Enter your credentials to continue
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email"
                        {...field}
                      />
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
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}