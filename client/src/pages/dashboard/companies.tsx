import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Company } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Globe, 
  Building2, 
  FileText, 
  MapPin, 
  X,
  Download,
  Users
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";

const companyFormSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  industry: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  size: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal(""))
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CompaniesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Get user's companies
  const { data, isLoading } = useQuery({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    }
  });
  
  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (company: CompanyFormValues) => {
      const res = await apiRequest("POST", "/api/companies", company);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Company created",
        description: "The company has been added successfully",
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive"
      });
    }
  });
  
  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, company }: { id: number, company: CompanyFormValues }) => {
      const res = await apiRequest("PATCH", `/api/companies/${id}`, company);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Company updated",
        description: "The company has been updated successfully",
      });
      setSelectedCompany(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update company",
        variant: "destructive"
      });
    }
  });
  
  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/companies/${id}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Company deleted",
        description: "The company has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCompany(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete company",
        variant: "destructive"
      });
    }
  });
  
  // Form for creating/editing companies
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: selectedCompany?.name || "",
      industry: selectedCompany?.industry || "",
      website: selectedCompany?.website || "",
      size: selectedCompany?.size || "",
      location: selectedCompany?.location || "",
      description: selectedCompany?.description || ""
    }
  });
  
  // Reset form when selected company changes
  useEffect(() => {
    if (selectedCompany) {
      form.reset({
        name: selectedCompany.name,
        industry: selectedCompany.industry || "",
        website: selectedCompany.website || "",
        size: selectedCompany.size || "",
        location: selectedCompany.location || "",
        description: selectedCompany.description || ""
      });
    } else {
      form.reset({
        name: "",
        industry: "",
        website: "",
        size: "",
        location: "",
        description: ""
      });
    }
  }, [selectedCompany, form]);
  
  // Filter companies based on search term
  const filteredCompanies = data?.companies.filter((company: Company) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      company.name.toLowerCase().includes(search) ||
      (company.industry && company.industry.toLowerCase().includes(search)) ||
      (company.location && company.location.toLowerCase().includes(search))
    );
  });
  
  // Get company size label
  const getCompanySizeLabel = (size: string | null | undefined) => {
    if (!size) return "-";
    
    const sizeMap: Record<string, string> = {
      "1-10": "1-10 employees",
      "11-50": "11-50 employees",
      "51-200": "51-200 employees",
      "201-500": "201-500 employees",
      "501-1000": "501-1000 employees",
      "1001-5000": "1001-5000 employees",
      "5001-10000": "5001-10000 employees",
      "10001+": "10001+ employees"
    };
    
    return sizeMap[size] || size;
  };

  // Get industry color
  const getIndustryColor = (industry: string | null | undefined) => {
    if (!industry) return "bg-neutral-100 text-neutral-800";
    
    const industryMap: Record<string, string> = {
      "technology": "bg-blue-100 text-blue-800",
      "healthcare": "bg-green-100 text-green-800",
      "finance": "bg-amber-100 text-amber-800",
      "manufacturing": "bg-orange-100 text-orange-800",
      "retail": "bg-purple-100 text-purple-800",
      "education": "bg-teal-100 text-teal-800",
      "consulting": "bg-indigo-100 text-indigo-800",
      "software": "bg-sky-100 text-sky-800"
    };
    
    return industryMap[industry.toLowerCase()] || "bg-neutral-100 text-neutral-800";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Companies</h1>
        <p className="text-neutral-600">Track and manage your target companies</p>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Companies</CardTitle>
              <CardDescription>
                You have {data?.companies?.length || 0} companies in your database
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search companies..."
                  className="pl-9 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus size={16} className="mr-2" /> Add Company
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Add New Company</DialogTitle>
                    <DialogDescription>
                      Create a new company in your CRM system
                    </DialogDescription>
                  </DialogHeader>
                  
                  <CompanyForm 
                    form={form} 
                    onSubmit={(data) => createCompanyMutation.mutate(data)}
                    isSubmitting={createCompanyMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : filteredCompanies?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company: Company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-md bg-primary-100 text-primary-700 flex items-center justify-center mr-3">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            {company.website && (
                              <a 
                                href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-primary-500 hover:underline flex items-center mt-1"
                              >
                                <Globe size={10} className="mr-1" />
                                {company.website.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.industry ? (
                          <Badge variant="outline" className={getIndustryColor(company.industry)}>
                            {company.industry}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {company.location ? (
                          <div className="flex items-center">
                            <MapPin size={14} className="mr-1 text-neutral-500" />
                            {company.location}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{getCompanySizeLabel(company.size)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a href={`/dashboard/contacts?company=${company.id}`}>
                              <Users size={16} className="text-neutral-500" />
                            </a>
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal size={16} className="text-neutral-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedCompany(company)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit Company</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedCompany(company);
                                setIsDeleteDialogOpen(true);
                              }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Company</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="mr-2 h-4 w-4" />
                                <span>View Contacts</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500">No companies found</p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-neutral-500">
            Showing {filteredCompanies?.length || 0} of {data?.companies?.length || 0} companies
          </div>
          
          <Button variant="outline" size="sm">
            <Download size={14} className="mr-1" /> Export Companies
          </Button>
        </CardFooter>
      </Card>
      
      {/* Edit Company Dialog */}
      {selectedCompany && (
        <Dialog 
          open={!!selectedCompany && !isDeleteDialogOpen} 
          onOpenChange={(open) => !open && setSelectedCompany(null)}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
              <DialogDescription>
                Update information for {selectedCompany.name}
              </DialogDescription>
            </DialogHeader>
            
            <CompanyForm 
              form={form} 
              onSubmit={(data) => updateCompanyMutation.mutate({ id: selectedCompany.id, company: data })}
              isSubmitting={updateCompanyMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCompany?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteCompanyMutation.mutate(selectedCompany!.id)}
              disabled={deleteCompanyMutation.isPending}
            >
              {deleteCompanyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Company"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Company Form Component
function CompanyForm({ 
  form, 
  onSubmit, 
  isSubmitting 
}: { 
  form: any, 
  onSubmit: (data: CompanyFormValues) => void,
  isSubmitting: boolean
}) {
  const industries = [
    "Technology", "Software", "Healthcare", "Finance", "Manufacturing", 
    "Retail", "Education", "Consulting", "Marketing", "Real Estate", "Other"
  ];
  
  const companySizes = [
    "1-10", "11-50", "51-200", "201-500", "501-1000", 
    "1001-5000", "5001-10000", "10001+"
  ];
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name*</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corporation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Size</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Unknown</SelectItem>
                    {companySizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size} employees
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
                  <Input placeholder="San Francisco, CA" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of the company" 
                  className="min-h-[100px]" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Company"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
