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
import { motion, AnimatePresence } from "framer-motion";
import Confetti from 'react-confetti';

// Password validation schema
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
  const [userName, setUserName] = React.useState<string>("");
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('token');
    console.log('Reset token from URL:', resetToken);

    if (resetToken) {
      setToken(resetToken);
      // Verify token and get user info
      apiRequest("GET", `/api/auth/verify-token?token=${resetToken}`)
        .then(res => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then(data => {
          console.log('Token verification response:', data);
          if (data.userName) {
            setUserName(data.userName);
          }
        })
        .catch(error => {
          console.error('Token verification error:', error);
          toast({
            title: "Error",
            description: "Invalid or expired reset token",
            variant: "destructive",
          });
          setLocation("/auth/login");
        });
    } else {
      setLocation("/auth/login");
    }
  }, [setLocation, toast]);

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      console.log("Password reset successful");
      setIsSuccess(true);
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
        duration: 5000,
      });
      setTimeout(() => {
        setLocation("/auth/login");
      }, 5000);
    },
    onError: (error: any) => {
      console.error("Password reset error:", error);
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#004990] via-[#0066cc] to-[#ffffff] flex items-center justify-center">
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Card className="w-[450px] backdrop-blur-sm bg-white/90 dark:bg-black/50 text-center p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            >
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-semibold mb-2"
            >
              Password Reset Successful!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground mb-4"
            >
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </motion.p>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#004990] via-[#0066cc] to-[#ffffff] flex items-center justify-center">
        <Card className="w-[450px] backdrop-blur-sm bg-white/90 dark:bg-black/50">
          <CardContent className="p-6">
            <p className="text-center text-red-500">Invalid or expired reset link</p>
            <Button
              className="w-full mt-4"
              onClick={() => setLocation("/auth/forgot-password")}
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#004990] via-[#0066cc] to-[#ffffff] flex items-center justify-center">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="w-[450px] backdrop-blur-sm bg-white/90 dark:bg-black/50">
            <CardHeader className="space-y-1 text-center">
              <h2 className="text-2xl font-semibold">Reset Password</h2>
              {userName && (
                <p className="text-sm text-muted-foreground">
                  Reset password for user: <span className="font-medium">{userName}</span>
                </p>
              )}
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
                            className="text-sm px-3 py-2"
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
                            className="text-sm px-3 py-2"
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
                    className="w-full bg-gradient-to-r from-[#004990] to-[#0066cc] hover:from-[#003870] hover:to-[#004990] text-white"
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}