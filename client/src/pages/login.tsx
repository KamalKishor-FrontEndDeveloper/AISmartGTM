import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Bot, Database } from "lucide-react";
import { useAuth } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [location, setLocation] = useLocation();
  const { login, isLoading } = useAuth();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    const success = await login(data.email, data.password);
    if (success) {
      setLocation("/dashboard");
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Brand Info */}
      <div className="hidden md:flex md:w-1/3 lg:w-1/2 bg-primary-600 text-white flex-col justify-center items-center p-10">
        <div className="max-w-md mx-auto">
          <div className="text-3xl font-bold mb-6">AI-Powered CRM System</div>
          <p className="text-primary-100 mb-8">Generate real-time B2B leads, get enriched contact data, and send AI-powered personalized outreach messages in one place.</p>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <Search className="text-primary-200" size={18} />
              </div>
              <div>
                <h3 className="font-medium">Real-Time B2B Lead Search</h3>
                <p className="text-primary-100 text-sm">Find qualified leads based on industry, job title, and more.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <Bot className="text-primary-200" size={18} />
              </div>
              <div>
                <h3 className="font-medium">AI-Powered Messaging</h3>
                <p className="text-primary-100 text-sm">Generate personalized outreach messages with AI assistance.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <Database className="text-primary-200" size={18} />
              </div>
              <div>
                <h3 className="font-medium">Data Enrichment</h3>
                <p className="text-primary-100 text-sm">Get detailed contact information and company insights.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-sm text-primary-200">
            <p>Trusted by 1000+ businesses worldwide</p>
          </div>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">Login to Your Account</h2>
              <Link href="/signup" className="text-primary-500 text-sm hover:text-primary-600">
                Create account
              </Link>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" type="email" {...field} />
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
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link href="/forgot-password" className="text-xs text-primary-500 hover:text-primary-600">
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input placeholder="Enter your password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </div>
                
                <div className="text-center mt-6">
                  <p className="text-sm text-neutral-600">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-primary-500 hover:text-primary-600 font-medium">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
