import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon, XIcon, Loader2Icon } from "lucide-react";

interface Step {
  label: string;
  description: string;
}

interface AnimatedProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  status: "idle" | "submitting" | "success" | "error";
  error?: string;
}

export function AnimatedProgressIndicator({
  steps,
  currentStep,
  status,
  error
}: AnimatedProgressIndicatorProps) {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  useEffect(() => {
    // Progressively reveal steps
    const revealSteps = async () => {
      for (let i = 0; i <= currentStep; i++) {
        setVisibleSteps(prev => Array.from(new Set([...prev, i])));
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    };

    revealSteps();
  }, [currentStep]);

  return (
    <div className="space-y-8 py-4">
      <div className="text-center mb-8">
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.h3
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-medium"
            >
              Processing Submission
            </motion.h3>
          )}
          {status === "submitting" && (
            <motion.h3
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-medium text-primary"
            >
              Processing Submission...
            </motion.h3>
          )}
          {status === "success" && (
            <motion.h3
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-medium text-green-500"
            >
              Submission Successful!
            </motion.h3>
          )}
          {status === "error" && (
            <motion.h3
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-medium text-destructive"
            >
              Submission Failed
            </motion.h3>
          )}
        </AnimatePresence>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-5 top-0 w-px h-full bg-gray-200" />

        {/* Animated Progress Overlay */}
        <motion.div
          className="absolute left-5 top-0 w-px bg-primary"
          initial={{ height: "0%" }}
          animate={{ 
            height: status === "error" 
              ? `${(currentStep / (steps.length - 1)) * 100}%` 
              : status === "success" 
                ? "100%" 
                : `${(currentStep / (steps.length - 1)) * 100}%` 
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Steps */}
        <div className="space-y-8">
          <AnimatePresence>
            {steps.map((step, index) => {
              // Determine status of this step
              const isCompleted = status === "success" || (index < currentStep);
              const isCurrent = index === currentStep && status === "submitting";
              const isErrored = index === currentStep && status === "error";
              const isPending = index > currentStep || status === "idle";

              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: visibleSteps.includes(index) ? 1 : 0.5, 
                    x: visibleSteps.includes(index) ? 0 : -10 
                  }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="relative flex items-start"
                >
                  {/* Step Circle Indicator */}
                  <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center z-10">
                    <div className={`absolute h-10 w-10 rounded-full ${
                      isCompleted 
                        ? "bg-green-50" 
                        : isErrored 
                          ? "bg-red-50" 
                          : isCurrent 
                            ? "bg-blue-50" 
                            : "bg-gray-50"
                    } flex items-center justify-center`}>
                      <AnimatePresence mode="wait">
                        {isCompleted && (
                          <motion.div
                            key="completed"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", duration: 0.4 }}
                          >
                            <CheckIcon className="h-5 w-5 text-green-500" />
                          </motion.div>
                        )}

                        {isCurrent && (
                          <motion.div
                            key="current"
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2Icon className="h-5 w-5 text-primary" />
                          </motion.div>
                        )}

                        {isErrored && (
                          <motion.div
                            key="error"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", duration: 0.4 }}
                          >
                            <XIcon className="h-5 w-5 text-red-500" />
                          </motion.div>
                        )}

                        {isPending && !isCurrent && (
                          <motion.div
                            key="pending"
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="ml-4 mt-1">
                    <h4 className={`text-sm font-medium ${
                      isCompleted 
                        ? "text-green-500" 
                        : isErrored 
                          ? "text-red-500" 
                          : isCurrent 
                            ? "text-primary" 
                            : "text-gray-500"
                    }`}>
                      {step.label}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {status === "error" && error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md"
          >
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm text-green-600">Form submitted successfully!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}