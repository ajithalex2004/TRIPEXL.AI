import * as React from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import { useAuth } from "@/hooks/use-auth";

export function WelcomeScreen() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <Confetti />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2 text-center"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Welcome to TripXL!
              </h1>
              <p className="text-xl text-muted-foreground">
                Hello, {user?.fullName}! We're excited to have you on board.
              </p>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  variant="default"
                  className="w-full h-24 relative overflow-hidden group"
                  onClick={() => setLocation("/new-booking")}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 transform group-hover:scale-105 transition-transform" />
                  <div className="space-y-2">
                    <h3 className="font-semibold">Create Your First Booking</h3>
                    <p className="text-sm text-muted-foreground">
                      Start your journey by creating a new booking
                    </p>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant="outline"
                  className="w-full h-24 relative overflow-hidden group"
                  onClick={() => setLocation("/profile")}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-background to-background/80 transform group-hover:scale-105 transition-transform" />
                  <div className="space-y-2">
                    <h3 className="font-semibold">Complete Your Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      Add your preferences and details
                    </p>
                  </div>
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center space-y-4 pt-4"
            >
              <p className="text-muted-foreground">
                Need help getting started?
              </p>
              <Button
                variant="link"
                onClick={() => setLocation("/guide")}
                className="text-primary"
              >
                View our quick start guide
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}