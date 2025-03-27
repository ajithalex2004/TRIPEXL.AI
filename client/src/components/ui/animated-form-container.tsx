import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface AnimatedFormContainerProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  isEditing?: boolean;
  children: React.ReactNode;
}

export function AnimatedFormContainer({
  form,
  onSubmit,
  isSubmitting,
  isEditing = false,
  children
}: AnimatedFormContainerProps) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Delay animation start for a smooth entrance
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Staggered animation for form elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <AnimatePresence>
          {animateIn && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
              variants={containerVariants}
              className="space-y-4"
            >
              <motion.div 
                className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 pb-6" 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {children}
              </motion.div>

              <motion.div 
                className="flex justify-end space-x-2 px-6 py-4 border-t"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative overflow-hidden"
                >
                  <span className="relative z-10">{isEditing ? "Update" : "Save"}</span>
                  
                  {/* Animated button background effect */}
                  <AnimatePresence>
                    {!isSubmitting && (
                      <motion.span
                        className="absolute inset-0 bg-primary/20"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1.5, 
                          ease: "linear" 
                        }}
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Loading spinner animation */}
                  {isSubmitting && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-primary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <svg 
                        className="animate-spin h-5 w-5 text-white" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        />
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </Form>
  );
}