import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FieldValues, UseFormReturn } from "react-hook-form";
import * as animationUtils from "@/lib/animation-utils";

interface AnimatedFormContainerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  children: ReactNode;
  isSubmitting: boolean;
  isEditing?: boolean;
}

export function AnimatedFormContainer<T extends FieldValues>({
  form,
  onSubmit,
  children,
  isSubmitting,
  isEditing = false
}: AnimatedFormContainerProps<T>) {
  return (
    <Form {...form}>
      <motion.form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 pb-2 scrollbar-thin"
        variants={animationUtils.staggerContainer(0.1, 0)}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-6">
          {children}
        </div>

        <motion.div
          className="flex justify-end gap-2 pt-4 border-t"
          variants={animationUtils.fadeIn("up", 0.4)}
        >
          <motion.div
            whileHover={animationUtils.buttonHoverEffect}
            whileTap={animationUtils.buttonTapEffect}
          >
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => form.reset()}
              disabled={isSubmitting}
            >
              Reset
            </Button>
          </motion.div>
          <motion.div
            whileHover={animationUtils.buttonHoverEffect}
            whileTap={animationUtils.buttonTapEffect}
          >
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isSubmitting ? (
                <motion.div 
                  className="flex items-center gap-2"
                  animate={{ opacity: [0.7, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5, repeatType: "reverse" }}
                >
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  <span>Saving...</span>
                </motion.div>
              ) : (
                isEditing ? "Update" : "Create"
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.form>
    </Form>
  );
}