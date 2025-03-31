import { useState } from "react";
import { motion } from "framer-motion";
import { Control, FieldValues, Path } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Textarea } from "./textarea";
import { useId } from "react";
import { cn } from "@/lib/utils";
import * as animationUtils from "@/lib/animation-utils";

// Base animated form field component
interface BaseAnimatedFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Input field
interface AnimatedInputFieldProps<T extends FieldValues> extends BaseAnimatedFieldProps<T> {
  type?: string;
  readOnly?: boolean;
}

export function AnimatedInputField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required = false,
  disabled = false,
  placeholder,
  type = "text",
  readOnly = false,
  className,
}: AnimatedInputFieldProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const id = useId();

  return (
    <motion.div
      variants={animationUtils.fadeIn("up")}
      className={className}
    >
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="relative">
            <FormLabel 
              htmlFor={id}
              className={cn(
                "transition-all duration-200 font-medium",
                isFocused && "text-primary"
              )}
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <Input
                  {...field}
                  id={id}
                  disabled={disabled}
                  placeholder={placeholder}
                  type={type}
                  readOnly={readOnly}
                  onFocus={() => setIsFocused(true)}
                  onBlur={(e) => {
                    field.onBlur();
                    setIsFocused(false);
                  }}
                  className={cn(
                    "transition-all duration-200",
                    isFocused && "border-primary ring-1 ring-primary/20",
                    readOnly && "bg-muted cursor-not-allowed opacity-70",
                  )}
                />
              </motion.div>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
}

// Number input field with min/max
interface AnimatedNumberInputFieldProps<T extends FieldValues> extends BaseAnimatedFieldProps<T> {
  min?: number;
  max?: number;
}

export function AnimatedNumberInputField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required = false,
  disabled = false,
  placeholder,
  min,
  max,
  className,
}: AnimatedNumberInputFieldProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const id = useId();

  return (
    <motion.div
      variants={animationUtils.fadeIn("up")}
      className={className}
    >
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="relative">
            <FormLabel 
              htmlFor={id}
              className={cn(
                "transition-all duration-200 font-medium",
                isFocused && "text-primary"
              )}
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <Input
                  {...field}
                  id={id}
                  type="number"
                  min={min}
                  max={max}
                  disabled={disabled}
                  placeholder={placeholder}
                  onFocus={() => setIsFocused(true)}
                  onBlur={(e) => {
                    field.onBlur();
                    setIsFocused(false);
                  }}
                  className={cn(
                    "transition-all duration-200",
                    isFocused && "border-primary ring-1 ring-primary/20"
                  )}
                  onChange={(e) => {
                    const value = e.target.value === "" ? "" : Number(e.target.value);
                    field.onChange(value);
                  }}
                />
              </motion.div>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
}

// Textarea field
interface AnimatedTextareaFieldProps<T extends FieldValues> extends BaseAnimatedFieldProps<T> {
  rows?: number;
}

export function AnimatedTextareaField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required = false,
  disabled = false,
  placeholder,
  rows = 3,
  className,
}: AnimatedTextareaFieldProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const id = useId();

  return (
    <motion.div
      variants={animationUtils.fadeIn("up")}
      className={className}
    >
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="relative">
            <FormLabel 
              htmlFor={id}
              className={cn(
                "transition-all duration-200 font-medium",
                isFocused && "text-primary"
              )}
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <Textarea
                  {...field}
                  id={id}
                  disabled={disabled}
                  placeholder={placeholder}
                  rows={rows}
                  onFocus={() => setIsFocused(true)}
                  onBlur={(e) => {
                    field.onBlur();
                    setIsFocused(false);
                  }}
                  className={cn(
                    "resize-none transition-all duration-200",
                    isFocused && "border-primary ring-1 ring-primary/20"
                  )}
                />
              </motion.div>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
}

// Checkbox field
interface AnimatedCheckboxFieldProps<T extends FieldValues> extends BaseAnimatedFieldProps<T> {
  onCheckedChange?: (checked: boolean) => void;
}

export function AnimatedCheckboxField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  disabled = false,
  onCheckedChange,
  className,
}: AnimatedCheckboxFieldProps<T>) {
  const id = useId();

  return (
    <motion.div
      variants={animationUtils.fadeIn("up")}
      className={className}
    >
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
            <FormControl>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Checkbox
                  id={id}
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    onCheckedChange?.(!!checked);
                  }}
                  disabled={disabled}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </motion.div>
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel
                htmlFor={id}
                className="text-sm font-medium cursor-pointer"
              >
                {label}
              </FormLabel>
              {description && (
                <FormDescription className="text-xs">
                  {description}
                </FormDescription>
              )}
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </motion.div>
  );
}

// Select field
interface SelectOption {
  value: string;
  label: string;
}

interface AnimatedSelectFieldProps<T extends FieldValues> extends BaseAnimatedFieldProps<T> {
  options: SelectOption[];
  onValueChange?: (value: string) => void;
}

export function AnimatedSelectField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required = false,
  disabled = false,
  placeholder,
  options,
  onValueChange,
  className,
}: AnimatedSelectFieldProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const id = useId();
  
  // Debug logging for options
  console.log(`AnimatedSelectField (${name}) options:`, options);
  console.log(`AnimatedSelectField (${name}) options length:`, options ? options.length : 0);

  return (
    <motion.div
      variants={animationUtils.fadeIn("up")}
      className={className}
    >
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="relative">
            <FormLabel 
              htmlFor={id}
              className={cn(
                "transition-all duration-200 font-medium",
                isFocused && "text-primary"
              )}
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <Select
                  disabled={disabled}
                  onValueChange={(value) => {
                    field.onChange(value);
                    onValueChange?.(value);
                  }}
                  defaultValue={field.value?.toString()}
                  value={field.value?.toString()}
                  onOpenChange={(open) => setIsFocused(open)}
                >
                  <SelectTrigger
                    id={id}
                    className={cn(
                      "w-full transition-all duration-200",
                      isFocused && "border-primary ring-1 ring-primary/20"
                    )}
                  >
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {options.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </motion.div>
                  </SelectContent>
                </Select>
              </motion.div>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
}