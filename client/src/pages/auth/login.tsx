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

export default function LoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
    <Card className="w-[400px] mx-auto mt-8">
      <CardHeader>
        <h2 className="text-2xl font-bold">Login</h2>
        <p className="text-sm text-gray-500">
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
                  <FormControl>
                    <Input {...field} type="password" placeholder="Enter your password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => setLocation("/auth/register")}
              >
                Don't have an account? Register
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
