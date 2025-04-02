import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { stepThreeSchema, StepThreeData } from "@shared/schema";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface StepThreeProps {
  onSubmit: (data: StepThreeData) => void;
  defaultValues: {
    verificationCode: string;
  };
  isSubmitting: boolean;
}

export default function StepThree({ onSubmit, defaultValues, isSubmitting }: StepThreeProps) {
  const form = useForm<StepThreeData>({
    resolver: zodResolver(stepThreeSchema),
    defaultValues: {
      verificationCode: defaultValues.verificationCode || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium mb-2">Verify Your Email</h3>
          <p className="text-neutral-600 text-sm">
            We've sent a 6-digit verification code to your email.<br />
            Enter the code below to confirm your account.
          </p>
          <p className="text-neutral-500 text-xs mt-2">
            (For demo purposes, use code: 123456)
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="verificationCode"
          render={({ field }) => (
            <FormItem className="mx-auto max-w-xs">
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="text-center mt-4">
          <Button variant="link" type="button" className="text-sm text-primary-500">
            Didn't receive a code? Resend
          </Button>
        </div>
        
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
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
