import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon, X, Loader2 } from "lucide-react";

const searchSchema = z.object({
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional()
}).refine(data => {
  // At least one field must be filled
  return Object.values(data).some(val => val && val.trim().length > 0);
}, {
  message: "At least one search field is required",
  path: ["jobTitle"]
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface SearchPanelProps {
  onSearch: (data: SearchFormValues) => void;
  isSearching: boolean;
}

export default function SearchPanel({ onSearch, isSearching }: SearchPanelProps) {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      jobTitle: "",
      company: "",
      industry: "",
      location: ""
    }
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
  
  const handleClearFilters = () => {
    form.reset();
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Search for Contacts</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="VP of Marketing, CTO, etc." 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Company name" 
                        {...field} 
                        value={field.value || ""}
                      />
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
                      onValueChange={(value) => {
                        // Handle the "all" value as empty for the form field
                        field.onChange(value === "all" ? "" : value);
                      }}
                      value={field.value || "all"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Select an industry</SelectItem>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry.toLowerCase()}>
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City, State, or Country" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                disabled={isSearching}
              >
                <X size={16} className="mr-2" /> Clear Filters
              </Button>
              
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Searching...
                  </>
                ) : (
                  <>
                    <SearchIcon size={16} className="mr-2" /> Search
                    <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">5 credits</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
