import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      return apiRequest("POST", "/api/login", data);
    },
    onSuccess: (data) => {
      login(data);
      toast({
        title: "Login successful",
        description: "Welcome back to Campus Closet!",
      });
      navigate("/");
    },
    onError: (error: any) => {
      setLoginError(error.message || "Invalid username or password");
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setLoginError(null);
    loginMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" alt="Campus Closet" className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign in to your account</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
                  {loginError}
                </div>
              )}
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="your_username" 
                        autoComplete="username"
                      />
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
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="••••••••" 
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-500">
            Don't have an account?{" "}
            <Link href="/register">
              <a className="font-medium text-primary hover:text-primary/90">
                Register
              </a>
            </Link>
          </div>
          
          {/* Demo credentials */}
          <div className="text-xs text-center text-gray-500 border-t pt-4">
            <p className="mb-2 font-medium">Demo Credentials</p>
            <p>Username: demo_user | Password: password123</p>
            <p>Username: another_user | Password: password123</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}