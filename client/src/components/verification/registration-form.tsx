import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { User, IdCard, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";

// Extend the schema with additional validation
const formSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export function RegistrationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const steps = [
    { label: "Account", icon: <User className="h-4 w-4" /> },
    { label: "Verification", icon: <IdCard className="h-4 w-4" /> },
    { label: "Complete", icon: <Check className="h-4 w-4" /> },
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      hostel: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Extract confirmPassword so it doesn't get sent to the API
      const { confirmPassword, ...userData } = values;
      
      // Use the updated apiRequest function signature
      const user = await apiRequest("POST", "/api/register", userData);
      
      // Log the user in
      login(user);
      
      toast({
        title: "Registration successful",
        description: "Let's continue with your ID verification",
      });
      
      navigate("/verification");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Get Started</h2>
        <p className="mt-2 text-sm text-gray-600">
          Join your campus fashion rental marketplace
        </p>
      </div>

      <ProgressSteps currentStep={0} steps={steps} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>College Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="you@university.edu"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hostel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hostel/Dorm</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your hostel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="North Campus Hall">
                      North Campus Hall
                    </SelectItem>
                    <SelectItem value="South Residence">
                      South Residence
                    </SelectItem>
                    <SelectItem value="West Wing Dormitory">
                      West Wing Dormitory
                    </SelectItem>
                    <SelectItem value="Central Housing">
                      Central Housing
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Continue to Verification"}
          </Button>

          <div className="text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a
                href="#"
                className="font-medium text-primary hover:text-primary-700"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
}
