import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { stepFourSchema, StepFourData } from "@shared/schema";

interface StepFourProps {
  onSubmit: (data: StepFourData) => void;
  defaultValues: {
    preferences: string[];
  };
  isSubmitting: boolean;
}

export default function StepFour({ onSubmit, defaultValues, isSubmitting }: StepFourProps) {
  const form = useForm<StepFourData>({
    resolver: zodResolver(stepFourSchema),
    defaultValues: {
      preferences: defaultValues.preferences || [],
    },
  });

  const preferences = [
    {
      id: "contact_search",
      label: "Contact Search",
      description: "Find qualified leads based on job title, company, and more"
    },
    {
      id: "email_enrichment",
      label: "Email Enrichment",
      description: "Reveal and verify professional email addresses"
    },
    {
      id: "ai_messaging",
      label: "AI Messaging",
      description: "Generate personalized outreach messages with AI"
    },
    {
      id: "crm_integration",
      label: "CRM Integration",
      description: "Connect with Salesforce, HubSpot, and other CRM systems"
    },
    {
      id: "analytics",
      label: "Analytics & Reporting",
      description: "Track campaign performance and conversion metrics"
    }
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium mb-2">Complete Your Setup</h3>
          <p className="text-neutral-600 text-sm">
            Select the features you're interested in to customize your experience
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="preferences"
          render={() => (
            <FormItem>
              <div className="space-y-4">
                {preferences.map((preference) => (
                  <FormField
                    key={preference.id}
                    control={form.control}
                    name="preferences"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={preference.id}
                          className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(preference.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, preference.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== preference.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              {preference.label}
                            </FormLabel>
                            <p className="text-xs text-neutral-500">
                              {preference.description}
                            </p>
                          </div>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
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
                Creating Account...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
