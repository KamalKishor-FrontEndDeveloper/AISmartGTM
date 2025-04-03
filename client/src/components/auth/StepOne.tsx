import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { stepOneSchema, StepOneData } from "@shared/schema";

interface StepOneProps {
  onSubmit: (data: StepOneData) => void;
  defaultValues: {
    fullName: string;
    email: string;
    password: string;
  };
  isSubmitting: boolean;
}

export default function StepOne({ onSubmit, defaultValues, isSubmitting }: StepOneProps) {
  const form = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      fullName: defaultValues.fullName || "",
      email: defaultValues.email || "",
      password: defaultValues.password || "",
    },
  });
  
  const passwordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };
  
  const getStrengthClass = (strength: number) => {
    if (strength === 0) return "bg-neutral-200";
    if (strength === 1) return "bg-red-500";
    if (strength === 2) return "bg-orange-500";
    if (strength === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input 
  placeholder="Enter your full name" 
  className="h-11 px-4 transition-shadow duration-200 hover:shadow-md focus:shadow-md" 
  {...field} 
/>
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
              <FormLabel>Work Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@company.com" {...field} />
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
                  type="password" 
                  placeholder="Create a password (min. 8 characters)" 
                  {...field} 
                />
              </FormControl>
              <div className="mt-1 flex space-x-1">
                {[0, 1, 2, 3].map((index) => (
                  <div 
                    key={index}
                    className={`h-1 w-1/4 rounded-full ${
                      index < passwordStrength(field.value) 
                        ? getStrengthClass(passwordStrength(field.value))
                        : "bg-neutral-200"
                    }`}
                  ></div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-xs text-neutral-600">
            By creating an account, you agree to our <a href="#" className="text-primary-500 hover:text-primary-600">Terms of Service</a> and <a href="#" className="text-primary-500 hover:text-primary-600">Privacy Policy</a>
          </p>
        </div>
      </form>
    </Form>
  );
}
