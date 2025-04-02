import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Contact } from "@shared/schema";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Plus, 
  Search, 
  Filter,
  Download,
  FilterX,
  ListFilter,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Grid,
  Menu as MenuIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import ContactsTable from "@/components/contacts/ContactsTable";
import ContactFilters from "@/components/contacts/ContactFilters";
import ContactForm from "@/components/contacts/ContactForm";
import { Badge } from "@/components/ui/badge";

const contactFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  jobTitle: z.string().optional().or(z.literal("")),
  companyId: z.number().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  linkedInUrl: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).optional()
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRevealingEmail, setIsRevealingEmail] = useState(false);
  
  // Get user's contacts
  const { data, isLoading } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await fetch("/api/contacts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    }
  });
  
  // Get user's companies for the form dropdown
  const { data: companiesData } = useQuery({
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
  
  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (contact: ContactFormValues) => {
      const res = await apiRequest("POST", "/api/contacts", contact);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact created",
        description: "The contact has been added successfully",
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contact",
        variant: "destructive"
      });
    }
  });
  
  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, contact }: { id: number, contact: ContactFormValues }) => {
      const res = await apiRequest("PATCH", `/api/contacts/${id}`, contact);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact updated",
        description: "The contact has been updated successfully",
      });
      setSelectedContact(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact",
        variant: "destructive"
      });
    }
  });
  
  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/contacts/${id}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact deleted",
        description: "The contact has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedContact(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact",
        variant: "destructive"
      });
    }
  });
  
  // Reveal email mutation
  const revealEmailMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const res = await apiRequest("POST", "/api/enrich/reveal-email", { contactId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Email revealed",
        description: `Email is: ${data.email}`,
      });
      setIsRevealingEmail(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reveal email",
        variant: "destructive"
      });
      setIsRevealingEmail(false);
    }
  });
  
  // Form for creating/editing contacts
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: selectedContact?.fullName || "",
      email: selectedContact?.email || "",
      phone: selectedContact?.phone || "",
      jobTitle: selectedContact?.jobTitle || "",
      companyId: selectedContact?.companyId || undefined,
      location: selectedContact?.location || "",
      linkedInUrl: selectedContact?.linkedInUrl || "",
      notes: selectedContact?.notes || "",
      tags: selectedContact?.tags || []
    }
  });
  
  // Reset form when selected contact changes
  React.useEffect(() => {
    if (selectedContact) {
      form.reset({
        fullName: selectedContact.fullName,
        email: selectedContact.email || "",
        phone: selectedContact.phone || "",
        jobTitle: selectedContact.jobTitle || "",
        companyId: selectedContact.companyId || undefined,
        location: selectedContact.location || "",
        linkedInUrl: selectedContact.linkedInUrl || "",
        notes: selectedContact.notes || "",
        tags: selectedContact.tags || []
      });
    } else {
      form.reset({
        fullName: "",
        email: "",
        phone: "",
        jobTitle: "",
        companyId: undefined,
        location: "",
        linkedInUrl: "",
        notes: "",
        tags: []
      });
    }
  }, [selectedContact, form]);
  
  // Handle revealing email
  const handleRevealEmail = (contactId: number) => {
    setIsRevealingEmail(true);
    revealEmailMutation.mutate(contactId);
  };
  
  // Filter contacts based on search term
  const filteredContacts = data?.contacts.filter((contact: Contact) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      contact.fullName.toLowerCase().includes(search) ||
      (contact.email && contact.email.toLowerCase().includes(search)) ||
      (contact.jobTitle && contact.jobTitle.toLowerCase().includes(search)) ||
      (contact.location && contact.location.toLowerCase().includes(search))
    );
  }) || [];
  
  // Calculate pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil((filteredContacts?.length || 0) / itemsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" className="text-blue-500">
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Contacts Search
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-500">
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Companies Search
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-medium text-primary-500">{user?.credits || 0}</span> Credits Available
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        {isFiltersVisible && (
          <div className="w-full md:w-64 flex-shrink-0">
            <ContactFilters />
          </div>
        )}
        
        <div className="flex-grow">
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col">
                <div className="flex items-center justify-between border-b p-3">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                      className="h-8"
                    >
                      {isFiltersVisible ? (
                        <FilterX className="h-4 w-4 mr-1" />
                      ) : (
                        <Filter className="h-4 w-4 mr-1" />
                      )}
                      {isFiltersVisible ? "Hide Filters" : "Filters"}
                    </Button>
                    
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search..."
                        className="pl-8 h-8 w-[200px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      <ListFilter className="h-4 w-4 mr-1" />
                      Filter
                    </Button>
                    
                    <div className="flex items-center space-x-1 border rounded overflow-hidden">
                      <Button variant="ghost" size="sm" className="rounded-none h-8 w-8 p-0">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-none h-8 w-8 p-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <span className="text-sm text-gray-500">
                      Showing 1 - {Math.min(paginatedContacts.length, itemsPerPage)} of {filteredContacts.length}
                    </span>
                    
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Grid className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MenuIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button size="sm" className="h-8">
                      Find All
                    </Button>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  </div>
                ) : filteredContacts.length > 0 ? (
                  <ContactsTable
                    contacts={paginatedContacts}
                    companies={companiesData?.companies || []}
                    onEmailReveal={handleRevealEmail}
                    onEditContact={setSelectedContact}
                    onDeleteContact={(contact) => {
                      setSelectedContact(contact);
                      setIsDeleteDialogOpen(true);
                    }}
                    onViewDetails={(contact) => {
                      // View details logic
                      toast({
                        title: "View Contact",
                        description: `Viewing ${contact.fullName}'s details`,
                      });
                    }}
                    isRevealingEmail={isRevealingEmail}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="flex flex-col items-center justify-center mb-4">
                      <Search className="h-12 w-12 text-gray-300 mb-2" />
                      <h3 className="text-lg font-medium">End of Results</h3>
                    </div>
                    <p className="text-gray-500 text-center mb-6">
                      Find more Contacts from our search in the left navigation, or simply click on one of our search starters.
                    </p>
                    <Button variant="primary" size="sm">
                      Reset all Filters
                    </Button>
                    
                    <div className="mt-8 flex items-center rounded-md bg-blue-50 px-3 py-2">
                      <span className="text-sm">
                        Show me contacts who are: 
                        <Badge className="ml-2 mr-1 bg-gray-200 text-gray-800">Senior</Badge>in
                        <Badge className="mx-1 bg-gray-200 text-gray-800">Finance</Badge>
                      </span>
                    </div>
                  </div>
                )}
                
                {filteredContacts.length > 0 && (
                  <div className="flex items-center justify-between border-t p-3">
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="text-sm"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      
                      <div className="px-2">
                        <span className="text-sm">{currentPage}</span>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="text-sm"
                      >
                        Next <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    
                    <div className="text-sm">
                      Jump to page: 
                      <Input 
                        type="number" 
                        min={1} 
                        max={totalPages} 
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= totalPages) {
                            handlePageChange(page);
                          }
                        }}
                        className="w-16 h-8 ml-2 inline-block"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Create Contact Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Create a new contact in your CRM system
            </DialogDescription>
          </DialogHeader>
          
          <ContactForm 
            form={form} 
            companies={companiesData?.companies || []}
            onSubmit={(data) => createContactMutation.mutate(data)}
            isSubmitting={createContactMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Contact Dialog */}
      {selectedContact && !isDeleteDialogOpen && (
        <Dialog 
          open={!!selectedContact && !isDeleteDialogOpen} 
          onOpenChange={(open) => !open && setSelectedContact(null)}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update this contact's information
              </DialogDescription>
            </DialogHeader>
            
            <ContactForm 
              form={form} 
              companies={companiesData?.companies || []}
              onSubmit={(data) => updateContactMutation.mutate({ id: selectedContact.id, contact: data })}
              isSubmitting={updateContactMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Contact Dialog */}
      {selectedContact && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Contact</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this contact? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteContactMutation.mutate(selectedContact.id)}
                disabled={deleteContactMutation.isPending}
              >
                {deleteContactMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Contact Dialog */}
      {selectedContact && (
        <Dialog 
          open={!!selectedContact && !isDeleteDialogOpen} 
          onOpenChange={(open) => !open && setSelectedContact(null)}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update contact information for {selectedContact.fullName}
              </DialogDescription>
            </DialogHeader>
            
            <ContactForm 
              form={form} 
              companies={companiesData?.companies || []}
              onSubmit={(data) => updateContactMutation.mutate({ id: selectedContact.id, contact: data })}
              isSubmitting={updateContactMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
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
              onClick={() => deleteContactMutation.mutate(selectedContact!.id)}
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Contact"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Contact Form Component
function ContactForm({ 
  form, 
  companies, 
  onSubmit, 
  isSubmitting 
}: { 
  form: any, 
  companies: any[], 
  onSubmit: (data: ContactFormValues) => void,
  isSubmitting: boolean
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name*</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" type="email" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="VP of Marketing" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : "")}
                  value={field.value ? field.value.toString() : ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
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
          
          <FormField
            control={form.control}
            name="linkedInUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://linkedin.com/in/username" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any notes about this contact" 
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
              "Save Contact"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
