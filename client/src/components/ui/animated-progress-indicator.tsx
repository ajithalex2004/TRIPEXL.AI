import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Circle, ArrowRight } from "lucide-react";
import * as animationUtils from "@/lib/animation-utils";

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
  return (
    <div className="w-full max-w-md mx-auto">
      <motion.h3
        className="text-lg font-semibold mb-6 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {status === "error" ? "Form Submission Failed" : 
         status === "success" ? "Form Submitted Successfully" : 
         "Submitting Form..."}
      </motion.h3>

      <motion.div 
        className="space-y-4"
        variants={animationUtils.staggerContainer(0.2, 0.1)}
        initial="hidden"
        animate="visible"
      >
        {steps.map((step, index) => {
          // Determine status for this step
          const isCompleted = 
            status === "success" || 
            (status === "submitting" && index < currentStep);
          
          const isCurrent = status === "submitting" && index === currentStep;
          
          const isError = status === "error" && index === currentStep;
          
          const isPending = index > currentStep;
          
          return (
            <motion.div
              key={index}
              className={`flex items-start gap-3 ${
                isCompleted ? "text-primary" : 
                isError ? "text-destructive" : 
                isCurrent ? "text-primary/80" : 
                "text-muted-foreground"
              }`}
              variants={animationUtils.fadeIn("right", index * 0.1)}
            >
              <div className="relative mt-1">
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </motion.div>
                ) : isError ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                  >
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </motion.div>
                ) : isCurrent ? (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Circle className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <Circle className="h-5 w-5 opacity-50" />
                )}
              </div>

              <div className="flex-1">
                <div className="font-medium">
                  {step.label}
                  {isCurrent && (
                    <motion.span
                      animate={{
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="inline-block ml-2"
                    >
                      <span className="text-primary inline-flex">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                      </span>
                    </motion.span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {step.description}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="absolute left-[1.15rem] h-[calc(100%-1.5rem)] top-6 w-px bg-border">
                  {(isPending || isCurrent) && (
                    <motion.div
                      className="absolute inset-0 bg-primary"
                      initial={{ scaleY: 0 }}
                      animate={isCurrent ? { scaleY: 0.5 } : { scaleY: 0 }}
                      transition={{ duration: 0.5 }}
                      style={{ transformOrigin: "top" }}
                    />
                  )}
                  {isCompleted && (
                    <motion.div
                      className="absolute inset-0 bg-primary"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5 }}
                      style={{ transformOrigin: "top" }}
                    />
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {status === "success" && (
        <motion.div
          className="mt-6 text-center text-green-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-lg font-medium">Completed Successfully</p>
        </motion.div>
      )}

      {status === "error" && (
        <motion.div
          className="mt-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">An error occurred</p>
              <p className="text-sm mt-1">{error || "Please try again or contact support if the issue persists."}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}