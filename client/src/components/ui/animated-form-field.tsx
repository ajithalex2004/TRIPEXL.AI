import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";

interface AnimatedSelectFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

export function AnimatedSelectField({ 
  name, 
  control, 
  label, 
  placeholder, 
  options, 
  required = false,
  disabled = false,
  onValueChange
}: AnimatedSelectFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FormItem className="relative">
            <FormLabel className={`${isFocused ? "text-primary" : ""} transition-colors duration-200`}>
              {label} {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <Select
              disabled={disabled}
              onValueChange={(value) => {
                field.onChange(value);
                if (onValueChange) onValueChange(value);
              }}
              value={field.value}
              onOpenChange={(open) => setIsFocused(open)}
            >
              <FormControl>
                <SelectTrigger className={`w-full border-2 transition-all duration-200 ${isFocused ? "border-primary ring-2 ring-primary/20" : "border-input"}`}>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <AnimatePresence>
                  {options.map((option) => (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <SelectItem value={option.value}>{option.label}</SelectItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </SelectContent>
            </Select>
            <AnimatePresence>
              {field.value && (
                <motion.div
                  className="absolute right-3 top-8 text-green-500"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
            <FormMessage />
          </FormItem>
        </motion.div>
      )}
    />
  );
}

interface AnimatedInputFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AnimatedInputField({ 
  name, 
  control, 
  label, 
  placeholder = "",
  type = "text",
  required = false,
  readOnly = false,
  onChange
}: AnimatedInputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FormItem className="relative">
            <FormLabel className={`${isFocused ? "text-primary" : ""} transition-colors duration-200`}>
              {label} {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={placeholder}
                type={type}
                readOnly={readOnly}
                className={`transition-all duration-200 ${isFocused ? "border-primary ring-2 ring-primary/20" : ""} ${readOnly ? "bg-gray-50" : ""}`}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => {
                  field.onChange(e);
                  if (onChange) onChange(e);
                }}
              />
            </FormControl>
            <AnimatePresence>
              {field.value && !isFocused && !readOnly && (
                <motion.div
                  className="absolute right-3 top-8 text-green-500"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
            <FormMessage />
          </FormItem>
        </motion.div>
      )}
    />
  );
}

interface AnimatedNumberInputFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

export function AnimatedNumberInputField({ 
  name, 
  control, 
  label, 
  placeholder = "",
  required = false,
  readOnly = false,
  min,
  max,
  step = 1,
  onChange
}: AnimatedNumberInputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FormItem className="relative group">
            <FormLabel className={`${isFocused ? "text-primary" : ""} transition-colors duration-200`}>
              {label} {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  {...field}
                  placeholder={placeholder}
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  readOnly={readOnly}
                  className={`transition-all duration-200 pr-12 ${isFocused ? "border-primary ring-2 ring-primary/20" : ""} ${readOnly ? "bg-gray-50" : ""}`}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    field.onChange(value);
                    if (onChange) onChange(value);
                  }}
                />
              </FormControl>
              
              {!readOnly && (
                <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col border rounded">
                  <motion.button
                    type="button"
                    className="px-2 py-0.5 text-xs hover:bg-gray-100"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const value = Number(field.value) + step;
                      if (max === undefined || value <= max) {
                        field.onChange(value);
                        if (onChange) onChange(value);
                      }
                    }}
                  >
                    +
                  </motion.button>
                  <motion.button
                    type="button"
                    className="px-2 py-0.5 text-xs hover:bg-gray-100 border-t"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const value = Number(field.value) - step;
                      if (min === undefined || value >= min) {
                        field.onChange(value);
                        if (onChange) onChange(value);
                      }
                    }}
                  >
                    -
                  </motion.button>
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {field.value && !isFocused && !readOnly && (
                <motion.div
                  className="absolute right-3 top-8 text-green-500"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
            <FormMessage />
          </FormItem>
        </motion.div>
      )}
    />
  );
}