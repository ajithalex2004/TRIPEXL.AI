import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {useEffect} from "react";

const userFormSchema = z.object({
  user_name: z.string().min(1, "Username is required"),
  user_code: z.string().min(1, "User code is required"),
  user_type: z.string().min(1, "User type is required"),
  email_id: z.string().email("Invalid email address"),
  country_code: z.string().default("+971"),
  mobile_number: z.string()
    .transform(val => val.replace(/^0+/, '')) // Remove leading zeros
    .refine(
      (val) => /^\d{9}$/.test(val),
      "Mobile number must be exactly 9 digits without leading zeros"
    ),
  user_operation_type: z.string().min(1, "Operation type is required"),
  user_group: z.string().min(1, "User group is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  full_name: z.string().min(1, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  is_active: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  defaultValues?: Partial<UserFormData>;
  mode: "create" | "edit";
  initialData?: Partial<UserFormData>; // Added initialData prop
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  mode,
  initialData, // Use initialData prop
}: UserFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = React.useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  const [mobileCheckStatus, setMobileCheckStatus] = React.useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      user_name: "",
      user_code: "",
      user_type: "EMPLOYEE",
      email_id: "",
      country_code: "+971",
      mobile_number: "",
      user_operation_type: "EMPLOYEE",
      user_group: "DEFAULT",
      first_name: "",
      last_name: "",
      full_name: "",
      is_active: true,
      ...defaultValues,
    },
  });

  // Get the current email and mobile values from the form
  const currentEmail = form.watch("email_id");
  const currentMobileNumber = form.watch("mobile_number");
  const currentCountryCode = form.watch("country_code");

  // Debounce the values
  const debouncedEmail = useDebounce(currentEmail, 500);
  const debouncedMobileNumber = useDebounce(currentMobileNumber, 500);
  const debouncedCountryCode = useDebounce(currentCountryCode, 500);

  // Check email availability when debounced email changes
  React.useEffect(() => {
    async function checkEmailAvailability() {
      if (!debouncedEmail || mode === "edit") return;

      try {
        setEmailCheckStatus({ checking: true });
        const response = await fetch(`/api/auth/check-email/${encodeURIComponent(debouncedEmail)}`);
        const data = await response.json();

        setEmailCheckStatus({
          checking: false,
          available: data.available,
          message: data.message
        });
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailCheckStatus({
          checking: false,
          message: "Failed to check email availability"
        });
      }
    }

    checkEmailAvailability();
  }, [debouncedEmail, mode]);

  // Check mobile number availability when debounced mobile number changes
  React.useEffect(() => {
    async function checkMobileAvailability() {
      if (!debouncedMobileNumber || !debouncedCountryCode || mode === "edit") return;

      try {
        setMobileCheckStatus({ checking: true });
        const response = await fetch(`/api/auth/check-mobile/${encodeURIComponent(debouncedCountryCode)}/${encodeURIComponent(debouncedMobileNumber)}`);
        const data = await response.json();

        setMobileCheckStatus({
          checking: false,
          available: data.available,
          message: data.message
        });
      } catch (error) {
        console.error('Error checking mobile number:', error);
        setMobileCheckStatus({
          checking: false,
          message: "Failed to check mobile number availability"
        });
      }
    }

    checkMobileAvailability();
  }, [debouncedMobileNumber, debouncedCountryCode, mode]);

  const handleSubmit = async (data: UserFormData) => {
    try {
      console.log('Submitting form data:', { ...data, password: '[REDACTED]' });
      setIsSubmitting(true);

      // Check email availability one final time before submission
      if (mode === "create") {
        const emailResponse = await fetch(`/api/auth/check-email/${encodeURIComponent(data.email_id)}`);
        const emailCheck = await emailResponse.json();

        if (!emailCheck.available) {
          throw new Error("Email is already registered");
        }

        // Check mobile number availability
        const mobileResponse = await fetch(`/api/auth/check-mobile/${encodeURIComponent(data.country_code)}/${encodeURIComponent(data.mobile_number)}`);
        const mobileCheck = await mobileResponse.json();

        if (!mobileCheck.available) {
          throw new Error("Mobile number is already registered");
        }
      }

      // Ensure all required fields are present
      const formattedData = {
        ...data,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        password: data.password || "Pass@123"
      };

      console.log('Submitting formatted data:', {
        ...formattedData,
        password: '[REDACTED]'
      });

      await onSubmit(formattedData);

      toast({
        title: "Success",
        description: `User ${mode === "create" ? "created" : "updated"} successfully`,
        variant: "default",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);

      // Show error toast with specific message
      toast({
        title: "Error",
        description: error instanceof Error
          ? error.message
          : "Failed to process user. Please check your input and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update full name when first or last name changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "first_name" || name === "last_name") {
        const firstName = value.first_name || "";
        const lastName = value.last_name || "";
        form.setValue("full_name", `${firstName} ${lastName}`.trim());
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        user_name: initialData.user_name,
        user_code: initialData.user_code,
        user_type: initialData.user_type,
        email_id: initialData.email_id,
        country_code: initialData.country_code || "+971",
        mobile_number: initialData.mobile_number,
        user_operation_type: initialData.user_operation_type,
        user_group: initialData.user_group,
        first_name: initialData.first_name,
        last_name: initialData.last_name,
        full_name: initialData.full_name,
        is_active: initialData.is_active,
      });
    }
  }, [initialData, form]);

  //Reset form when mode changes
  useEffect(() => {
    form.reset();
  }, [mode, form.reset]);


  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove leading zeros and non-digit characters
    const trimmedValue = e.target.value.replace(/^0+/, '').replace(/\D/g, '');
    // Update the form with trimmed value
    form.setValue('mobile_number', trimmedValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New User" : "Edit User"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="user_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter user code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter first name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter last name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Enter email" />
                    </FormControl>
                    {emailCheckStatus.checking ? (
                      <FormDescription>
                        <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                        Checking email availability...
                      </FormDescription>
                    ) : emailCheckStatus.message ? (
                      <FormDescription className={emailCheckStatus.available ? "text-green-600" : "text-red-600"}>
                        {emailCheckStatus.message}
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country Code</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || "+971"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country code" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="+971">UAE (+971)</SelectItem>
                          <SelectItem value="+91">India (+91)</SelectItem>
                          <SelectItem value="+1">USA (+1)</SelectItem>
                          {/* Add more country codes as needed */}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="Enter mobile number"
                          maxLength={9}
                          onChange={(e) => {
                            // Remove leading zeros and non-digit characters
                            const trimmedValue = e.target.value.replace(/^0+/, '').replace(/\D/g, '');
                            // Only update if the value is empty or consists of digits
                            if (trimmedValue === '' || /^\d+$/.test(trimmedValue)) {
                              field.onChange(trimmedValue);
                            }
                          }}
                          value={field.value || ''}
                        />
                      </FormControl>
                      {mobileCheckStatus.checking ? (
                        <FormDescription>
                          <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                          Checking mobile number...
                        </FormDescription>
                      ) : mobileCheckStatus.message ? (
                        <FormDescription className={mobileCheckStatus.available ? "text-green-600" : "text-red-600"}>
                          {mobileCheckStatus.message}
                        </FormDescription>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="user_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                        <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                        <SelectItem value="MANAGEMENT">Management</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_operation_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operation type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                        <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                        <SelectItem value="MANAGEMENT">Management</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Group</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DEFAULT">Default</SelectItem>
                        <SelectItem value="OPERATIONS">Operations</SelectItem>
                        <SelectItem value="MANAGEMENT">Management</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode === "create" && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="bg-[#004990] hover:bg-[#003870]"
                disabled={isSubmitting ||
                  (mode === "create" && (!emailCheckStatus.available || !mobileCheckStatus.available))}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>{mode === "create" ? "Create User" : "Update User"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}