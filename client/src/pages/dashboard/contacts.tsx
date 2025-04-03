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
import { Checkbox } from "@/components/ui/checkbox";
import { SendEmailDialog } from "@/components/contacts/SendEmailDialog";
import { 
  Loader2, 
  Plus, 
  Search, 
  Filter,
  FilterX,
  ArrowLeft,
  ArrowRight,
  Grid,
  Menu as MenuIcon,
  Linkedin,
  Sparkles,
  Mail,
  Phone,
  Globe,
  Building,
  MessageSquare,
  Send
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
  companyName: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  teamSize: z.string().optional().or(z.literal("")),
  linkedInUrl: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactsNewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRevealingEmail, setIsRevealingEmail] = useState(false);
  const [isEnrichmentDialogOpen, setIsEnrichmentDialogOpen] = useState(false);
  const [isLinkedInDialogOpen, setIsLinkedInDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isWriteMessageDialogOpen, setIsWriteMessageDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isEmailFinding, setIsEmailFinding] = useState(false);
  const [findingEmailId, setFindingEmailId] = useState<number | null>(null);

  // Email finder mutation
  const findEmailMutation = useMutation({
    mutationFn: async (contact: Contact) => {
      const [firstName, ...lastNameParts] = contact.fullName.split(' ');
      const lastName = lastNameParts.join(' ');
      
      if (!contact.companyName) {
        throw new Error('Company name is required to find email');
      }

      return apiRequest('/api/email/find', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          domainOrCompany: contact.companyName.toLowerCase().replace(/\s+/g, '')
        })
      });
    },
    onSuccess: (data, contact) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: 'Email Found',
        description: `Email address found for ${contact.fullName}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to find email address',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsEmailFinding(false);
      setFindingEmailId(null);
    }
  });

  const handleEmailFind = async (contact: Contact) => {
    setIsEmailFinding(true);
    setFindingEmailId(contact.id);
    await findEmailMutation.mutateAsync(contact);
  };

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
      return apiRequest("/api/contacts", {
        method: "POST",
        body: JSON.stringify(contact)
      });
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
      return apiRequest(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contact)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact updated",
        description: "The contact has been updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditContact(null);
      toast({
        title: "Contact updated",
        description: "The contact has been updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditContact(null);
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
      return apiRequest(`/api/contacts/${id}`, {
        method: "DELETE"
      });
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
      return apiRequest("/api/enrich/reveal-email", {
        method: "POST",
        body: JSON.stringify({ contactId })
      });
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

  // Create separate state for edit contact to avoid conflicts with other dialogs
  const [editContact, setEditContact] = useState<Contact | null>(null);

  // Form for creating/editing contacts
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: editContact?.fullName || "",
      email: editContact?.email || "",
      phone: editContact?.phone || "",
      jobTitle: editContact?.jobTitle || "",
      companyName: editContact?.companyName || "",
      industry: editContact?.industry || "",
      teamSize: editContact?.teamSize || "",
      linkedInUrl: editContact?.linkedInUrl || "",
      notes: editContact?.notes || "",
    }
  });

  // Reset form when edit contact changes
  useEffect(() => {
    if (editContact) {
      form.reset({
        fullName: editContact.fullName,
        email: editContact.email || "",
        phone: editContact.phone || "",
        jobTitle: editContact.jobTitle || "",
        companyName: editContact.companyName || "",
        industry: editContact.industry || "",
        teamSize: editContact.teamSize || "",
        linkedInUrl: editContact.linkedInUrl || "",
        notes: editContact.notes || ""
      });
      setIsEditDialogOpen(true);
    } else {
      form.reset({
        fullName: "",
        email: "",
        phone: "",
        jobTitle: "",
        companyName: "",
        industry: "",
        teamSize: "",
        linkedInUrl: "",
        notes: ""
      });
    }
  }, [editContact, form]);

  // Handle revealing email
  const handleRevealEmail = (contactId: number) => {
    setIsRevealingEmail(true);
    revealEmailMutation.mutate(contactId);
  };

  // Handle contact enrichment
  const [enrichmentOptions, setEnrichmentOptions] = useState([
    { id: "email", label: "Email Address", creditCost: 2, checked: true, icon: <Mail className="h-4 w-4 text-blue-500" /> },
    { id: "phone", label: "Phone Number", creditCost: 3, checked: true, icon: <Phone className="h-4 w-4 text-green-500" /> },
    { id: "social", label: "Social Profiles", creditCost: 1, checked: false, icon: <Linkedin className="h-4 w-4 text-blue-600" /> },
    { id: "company", label: "Company Details", creditCost: 4, checked: false, icon: <Building className="h-4 w-4 text-amber-500" /> }
  ]);

  const toggleEnrichmentOption = (id: string) => {
    setEnrichmentOptions(options => 
      options.map(option => 
        option.id === id ? { ...option, checked: !option.checked } : option
      )
    );
  };

  const getTotalEnrichmentCost = () => {
    return enrichmentOptions
      .filter(option => option.checked)
      .reduce((total, option) => total + option.creditCost, 0);
  };

  const enrichContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const options = enrichmentOptions
        .filter(option => option.checked)
        .map(option => option.id);

      const response = await fetch("/api/enrich/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({ 
          contactId,
          options
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to enrich contact");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact Enriched",
        description: "The contact has been successfully enriched with additional data",
      });
      setIsEnrichmentDialogOpen(false);
      setSelectedContact(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enrich contact data",
        variant: "destructive"
      });
    }
  });

  // Generate LinkedIn message
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");

  // Generate Email message
  const [isGeneratingEmailMessage, setIsGeneratingEmailMessage] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const generateLinkedInMessage = async (contact: Contact) => {
    setIsGeneratingMessage(true);
    try {
      const response = await fetch("/api/message/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({
          contactFullName: contact.fullName,
          contactJobTitle: contact.jobTitle,
          contactCompanyName: companiesData?.companies.find((c: any) => c.id === contact.companyId)?.name || "",
          userFullName: user?.fullName,
          userJobTitle: "CRM Specialist",
          userCompanyName: "AI-CRM",
          purpose: "introduction",
          tone: "professional"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate message");
      }

      const data = await response.json();
      setGeneratedMessage(data.message);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate LinkedIn message",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const generateEmailMessage = async (contact: Contact) => {
    setIsGeneratingEmailMessage(true);
    setEmailSubject(`Introduction from ${user?.fullName}`);
    setEmailBody(`Dear ${contact.fullName},\n\nI hope this email finds you well.\n\nI wanted to reach out to discuss how we might be able to collaborate.\n\nBest regards,\n${user?.fullName}`);

    try {
      const response = await fetch("/api/message/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({
          contactFullName: contact.fullName,
          contactJobTitle: contact.jobTitle,
          contactCompanyName: companiesData?.companies.find((c: any) => c.id === contact.companyId)?.name || "",
          userFullName: user?.fullName,
          userJobTitle: "CRM Specialist",
          userCompanyName: "AI-CRM",
          purpose: "introduction",
          tone: "professional"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate email");
      }

      const data = await response.json();
      // Format the email with subject line
      setEmailSubject(`Connecting with ${contact.fullName} from ${companiesData?.companies.find((c: any) => c.id === contact.companyId)?.name || "your company"}`);
      setEmailBody(data.message);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate email message",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingEmailMessage(false);
    }
  };

  // Handle LinkedIn connection request
  const sendLinkedInRequestMutation = useMutation({
    mutationFn: async ({ contactId, message }: { contactId: number, message: string }) => {
      return apiRequest("/api/linkedin/connect", {
        method: "POST",
        body: JSON.stringify({ contactId, message })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "LinkedIn Request Sent",
        description: "Your connection request has been queued for sending",
      });
      setIsLinkedInDialogOpen(false);
      setSelectedContact(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send LinkedIn connection request",
        variant: "destructive"
      });
    }
  });

  // Handle writing AI message
  const handleWriteMessage = (contact: Contact) => {
    setSelectedContact(contact);
    // Navigate to AI Writer page with contact info as URL parameters
    const contactParams = encodeURIComponent(JSON.stringify({
      id: contact.id,
      fullName: contact.fullName,
      jobTitle: contact.jobTitle || "",
      companyName: companiesData?.companies.find((c: any) => c.id === contact.companyId)?.name || ""
    }));
    window.location.href = `/dashboard/ai-writer?contact=${contactParams}`;
  };

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ contactId, subject, body }: { contactId: number, subject: string, body: string }) => {
      return apiRequest("/api/email/send", {
        method: "POST",
        body: JSON.stringify({ contactId, subject, body })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully",
      });
      setIsEmailDialogOpen(false);
      setSelectedContact(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    }
  });

  // Email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async (contact: Contact) => {
      if (!contact.email) {
        throw new Error("No email to verify");
      }
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({ email: contact.email })
      });
      if (!response.ok) {
        throw new Error("Failed to verify email");
      }
      return response.json();
    },
    onSuccess: (data, contact) => {
      queryClient.setQueryData(["/api/contacts"], (oldData: any) => {
        return {
          ...oldData,
          contacts: oldData.contacts.map((c: Contact) =>
            c.id === contact.id ? { ...c, emailVerified: data.isValid } : c
          )
        };
      });
      toast({
        title: data.isValid ? "Email Verified" : "Email Invalid",
        description: `${contact.email} is ${data.isValid ? "valid" : "invalid"}`,
        variant: data.isValid ? "default" : "destructive"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleVerifyEmail = async (contact: Contact) => {
    if (!contact.email) {
      toast({
        title: "Error",
        description: "No email address to verify",
        variant: "destructive"
      });
      return;
    }
    verifyEmailMutation.mutate(contact);
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
  const totalPages = Math.ceil((filteredContacts?.length || 0) / pageSize);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

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
                    Showing {filteredContacts.length > 0 ? 1 : 0} - {Math.min(paginatedContacts.length, pageSize)} of {filteredContacts.length}
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
                  onEditContact={setEditContact}
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
                  onEnrichContact={(contact) => {
                    setSelectedContact(contact);
                    setIsEnrichmentDialogOpen(true);
                  }}
                  onSendEmail={(contact) => {
                    setSelectedContact(contact);
                    setIsEmailDialogOpen(true);
                    // Pre-generate an email message when the dialog opens
                    generateEmailMessage(contact);
                  }}
                  onWriteMessage={handleWriteMessage}
                  onVerifyEmail={handleVerifyEmail}
                  isRevealingEmail={isRevealingEmail}
                  isVerifyingEmail={verifyEmailMutation.isPending}
                  isEmailFinding={isEmailFinding}
                  findingEmailId={findingEmailId}
                  onEmailFind={handleEmailFind}
                  handleAIWriter={handleWriteMessage}
                  handleCRMExport={(contact) => {
                    // Handle CRM export logic
                    toast({
                      title: "Export to CRM",
                      description: `Exporting ${contact.fullName} to CRM`,
                    });
                  }}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
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
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditContact(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update this contact's information
            </DialogDescription>
          </DialogHeader>

          {editContact && (
            <ContactForm 
              form={form} 
              companies={companiesData?.companies || []}
              onSubmit={(data) => updateContactMutation.mutate({ id: editContact.id, contact: data })}
              isSubmitting={updateContactMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

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

      {/* LinkedIn Connection Request Dialog */}
      {selectedContact && (
        <Dialog open={isLinkedInDialogOpen} onOpenChange={setIsLinkedInDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send LinkedIn Connection Request</DialogTitle>
              <DialogDescription>
                Send a personalized connection request to {selectedContact.fullName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Linkedin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">{selectedContact.fullName}</h4>
                  <p className="text-sm text-gray-500">{selectedContact.jobTitle}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Personalized Message
                </label>
                <textarea 
                  className="w-full p-2 border border-gray-200 rounded-md min-h-[120px]"
                  placeholder={`Hi ${selectedContact.fullName},\n\nI'd like to connect with you on LinkedIn.\n\nBest regards,\n${user?.fullName}`}
                  value={generatedMessage}
                  onChange={(e) => setGeneratedMessage(e.target.value)}
                  id="linkedin-message"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    This will cost 2 credits to send a connection request
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => generateLinkedInMessage(selectedContact)}
                    disabled={isGeneratingMessage}
                  >
                    {isGeneratingMessage ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-3 w-3 text-amber-500" />
                        Generate AI Message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsLinkedInDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const message = (document.getElementById('linkedin-message') as HTMLTextAreaElement).value;
                  sendLinkedInRequestMutation.mutate({
                    contactId: selectedContact.id,
                    message
                  });
                }}
                disabled={sendLinkedInRequestMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendLinkedInRequestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Connection Request"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Contact Enrichment Dialog */}
      {selectedContact && (
        <Dialog open={isEnrichmentDialogOpen} onOpenChange={setIsEnrichmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enrich Contact Data</DialogTitle>
              <DialogDescription>
                Use AI to find additional information about {selectedContact.fullName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">{selectedContact.fullName}</h4>
                  <p className="text-sm text-gray-500">{selectedContact.jobTitle}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select data to enrich:
                </label>
                <Card>
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      {enrichmentOptions.map(option => (
                        <div key={option.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Checkbox 
                              id={`enrich-${option.id}`}
                              checked={option.checked}
                              onCheckedChange={() => toggleEnrichmentOption(option.id)}
                              className="mr-2"
                            />
                            <label 
                              htmlFor={`enrich-${option.id}`}
                              className="text-sm font-medium cursor-pointer flex items-center"
                            >
                              {option.icon}
                              <span className="ml-2">{option.label}</span>
                            </label>
                          </div>
                          <Badge variant="outline" className="ml-4">
                            {option.creditCost} Credit{option.creditCost > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <span className="text-sm font-medium">Total Cost</span>
                <Badge variant="outline" className="bg-white">
                  {getTotalEnrichmentCost()} Credit{getTotalEnrichmentCost() > 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="text-sm text-gray-500">
                Your available credits: <span className="font-medium">{user?.credits || 0}</span>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEnrichmentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => enrichContactMutation.mutate(selectedContact.id)}
                disabled={enrichContactMutation.isPending || getTotalEnrichmentCost() > (user?.credits || 0) || getTotalEnrichmentCost() === 0}
              >
                {enrichContactMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enriching...
                  </>
                ) : (
                  "Enrich Contact"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Send Email Dialog */}
      {selectedContact && (
        <SendEmailDialog
          isOpen={isEmailDialogOpen}
          onClose={() => setIsEmailDialogOpen(false)}
          contact={selectedContact}
          user={user}
          onGenerateAIMessage={generateEmailMessage}
          isGeneratingMessage={isGeneratingEmailMessage}
          generatedMessage={emailBody}
        />
      )}
    </div>
  );

}