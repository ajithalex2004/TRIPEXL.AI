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
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm({
    defaultValues: {
      userName: "",
      emailId: "",
    },
  });

  const forgotPassword = useMutation({
    mutationFn: async (data: any) => {
      console.log('Requesting password reset for:', data);
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to process request");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Password reset instructions sent to your email",
      });
      setLocation("/auth/login");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    console.log('Form submitted with:', data);
    forgotPassword.mutate(data);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#004990] via-[#0066cc] to-[#ffffff] relative overflow-hidden">
      <div className="container mx-auto h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          className="w-full max-w-[450px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-black/50 border border-white/20 px-4 py-6">
            <CardHeader className="space-y-1 text-center">
              <h2 className="text-2xl font-semibold">Forgot Password</h2>
              <p className="text-sm text-muted-foreground">
                Enter your username and email to reset your password
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your username"
                            className="text-sm px-3 py-2"
                          />
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
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email"
                            className="text-sm px-3 py-2"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#004990] to-[#0066cc] hover:from-[#003870] hover:to-[#004990] text-white"
                    disabled={forgotPassword.isPending}
                  >
                    {forgotPassword.isPending ? (
                      <>
                        <LoadingIndicator className="mr-2" />
                        Sending Reset Instructions...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                  <div className="text-center mt-4">
                    <Button
                      variant="link"
                      className="text-sm text-[#004990] hover:text-[#003870]"
                      onClick={() => setLocation("/auth/login")}
                    >
                      Back to Login
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
