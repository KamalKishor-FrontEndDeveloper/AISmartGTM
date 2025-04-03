import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { stepTwoSchema, StepTwoData } from "@shared/schema";

interface StepTwoProps {
  onSubmit: (data: StepTwoData) => void;
  defaultValues: {
    companyName: string;
    industry: string;
    role: string;
  };
  isSubmitting: boolean;
}

export default function StepTwo({ onSubmit, defaultValues, isSubmitting }: StepTwoProps) {
  const form = useForm<StepTwoData>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: {
      companyName: defaultValues.companyName || "",
      industry: defaultValues.industry || "",
      role: defaultValues.role || "",
    },
  });

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "E-commerce",
    "Manufacturing",
    "Marketing",
    "Education",
    "Consulting",
    "Real Estate",
    "Other"
  ];

  const roles = [
    "CEO/Founder",
    "Sales Manager",
    "Marketing Manager",
    "Sales Representative",
    "CTO",
    "CFO",
    "HR Manager",
    "Business Development",
    "Product Manager",
    "Other"
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-11 transition-shadow duration-200 hover:shadow-md focus:shadow-md">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-11 transition-shadow duration-200 hover:shadow-md focus:shadow-md">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4 flex space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-1/3"
            onClick={() => history.back()}
          >
            Back
          </Button>
          <Button type="submit" className="w-2/3" disabled={isSubmitting}>
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
      </form>
    </Form>
  );
}