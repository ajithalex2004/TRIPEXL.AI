import { motion } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export type SubmissionStatus = "idle" | "submitting" | "success" | "error";

interface ProgressIndicatorProps {
  status: SubmissionStatus;
  steps: {
    label: string;
    description: string;
  }[];
  currentStep: number;
  error?: string;
}

export function ProgressIndicator({
  status,
  steps,
  currentStep,
  error
}: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={step.label} className="relative">
              <div className="flex items-center">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full">
                  {isComplete ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : isCurrent && status === "submitting" ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : isCurrent && status === "error" ? (
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-muted" />
                  )}
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {step.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="absolute left-4 top-8 -ml-px h-full w-0.5 bg-muted" />
              )}
            </div>
          );
        })}
      </div>
      {status === "error" && error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-md bg-destructive/10 text-destructive text-sm"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
