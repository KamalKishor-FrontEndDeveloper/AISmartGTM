import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Contact } from "@shared/schema";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Plus, 
  Search, 
  Filter,
  FilterX,
  ArrowLeft,
  ArrowRight,
  Grid,
  Menu as MenuIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ContactsTable from "@/components/contacts/ContactsTable";
import ContactFilters from "@/components/contacts/ContactFilters";
import ContactForm from "@/components/contacts/ContactForm";

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

export default function ContactsNewPage() {
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
  useEffect(() => {
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
            <CardHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contacts</CardTitle>
                  <CardDescription>Manage your business contacts</CardDescription>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
                  <span className="text-sm text-gray-500">
                    Showing {filteredContacts.length > 0 ? 1 : 0} - {Math.min(paginatedContacts.length, itemsPerPage)} of {filteredContacts.length}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Grid className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MenuIcon className="h-4 w-4" />
                    </Button>
                  </div>
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
                    <h3 className="text-lg font-medium">No contacts found</h3>
                  </div>
                  <p className="text-gray-500 text-center mb-6">
                    {searchTerm 
                      ? "No contacts match your search criteria" 
                      : "Get started by adding your first contact"}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Contact
                  </Button>
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
                      <span className="text-sm">{currentPage} of {totalPages}</span>
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
                </div>
              )}
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
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteContactMutation.mutate(selectedContact.id)}
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
      )}
    </div>
  );
}