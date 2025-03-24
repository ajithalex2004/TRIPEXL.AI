import * as React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2 } from "lucide-react";

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('token');

    if (!resetToken) {
      toast({
        title: "Error",
        description: "Invalid reset link",
        variant: "destructive",
      });
      setLocation("/auth/login");
      return;
    }

    setToken(resetToken);
  }, [setLocation, toast]);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      if (!token) throw new Error('No reset token found');

      const res = await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reset password");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your password has been reset successfully. Please log in with your new password.",
      });
      setLocation("/auth/login");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Invalid reset token",
        variant: "destructive",
      });
      return;
    }
    resetPassword.mutate(data);
  });

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#004990] via-[#0066cc] to-[#ffffff] flex items-center justify-center">
      <Card className="w-[450px] backdrop-blur-sm bg-white/90 dark:bg-black/50">
        <CardHeader className="space-y-1 text-center">
          <h2 className="text-2xl font-semibold">Reset Your Password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter new password"
                      />
                    </FormControl>
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
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-sm text-muted-foreground">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character</li>
                </ul>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={resetPassword.isPending}
              >
                {resetPassword.isPending ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting Password...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}