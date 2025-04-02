import { useState, useEffect } from "react";
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
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Search, 
  Plus, 
  X, 
  ListFilter, 
  Download, 
  Users, 
  Mail, 
  Trash2,
  Bot
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";

const contactListSchema = z.object({
  name: z.string().min(2, "List name is required"),
  description: z.string().optional().or(z.literal("")),
  contacts: z.array(z.number()).min(1, "At least one contact is required")
});

type ContactListFormValues = z.infer<typeof contactListSchema>;

// Mock lists since the backend doesn't have this feature yet
const mockLists = [
  {
    id: 1,
    name: "Sales Prospects",
    description: "Potential sales leads to follow up with",
    contacts: [1, 2]
  },
  {
    id: 2,
    name: "Marketing Contacts",
    description: "Marketing professionals for campaign outreach",
    contacts: [3]
  }
];

export default function ContactListPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false);
  const [lists, setLists] = useState(mockLists);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  
  // Get user's contacts
  const { data: contactsData, isLoading: isLoadingContacts } = useQuery({
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
  
  // Create list form
  const form = useForm<ContactListFormValues>({
    resolver: zodResolver(contactListSchema),
    defaultValues: {
      name: "",
      description: "",
      contacts: []
    }
  });
  
  // Set selected contacts when the form is opened
  useEffect(() => {
    if (isCreateListDialogOpen) {
      form.setValue("contacts", selectedContacts);
    }
  }, [isCreateListDialogOpen, form, selectedContacts]);
  
  // Create list (mock implementation)
  const handleCreateList = (data: ContactListFormValues) => {
    const newList = {
      id: lists.length + 1,
      ...data
    };
    
    setLists([...lists, newList]);
    setIsCreateListDialogOpen(false);
    toast({
      title: "List created",
      description: `${data.name} has been created with ${data.contacts.length} contacts`,
    });
    form.reset();
  };
  
  // Delete list (mock implementation)
  const handleDeleteList = (listId: number) => {
    setLists(lists.filter(list => list.id !== listId));
    if (activeListId === listId) {
      setActiveListId(null);
    }
    toast({
      title: "List deleted",
      description: "The contact list has been deleted",
    });
  };
  
  // Toggle contact selection
  const toggleContactSelection = (contactId: number) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };
  
  // Select all visible contacts
  const selectAllContacts = () => {
    const allVisibleContactIds = filteredContacts.map(contact => contact.id);
    setSelectedContacts(allVisibleContactIds);
  };
  
  // Clear all selections
  const clearAllSelections = () => {
    setSelectedContacts([]);
  };
  
  // Filter contacts based on search term
  const filteredContacts = contactsData?.contacts?.filter((contact: Contact) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      contact.fullName.toLowerCase().includes(search) ||
      (contact.email && contact.email.toLowerCase().includes(search)) ||
      (contact.jobTitle && contact.jobTitle.toLowerCase().includes(search)) ||
      (contact.location && contact.location.toLowerCase().includes(search))
    );
  }) || [];
  
  // Get contacts for active list
  const activeListContacts = activeListId 
    ? contactsData?.contacts?.filter((contact: Contact) => {
        const activeList = lists.find(list => list.id === activeListId);
        return activeList?.contacts.includes(contact.id);
      }) 
    : [];
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  // Get random background color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-primary-100 text-primary-700",
      "bg-blue-100 text-blue-700",
      "bg-amber-100 text-amber-700",
      "bg-green-100 text-green-700",
      "bg-purple-100 text-purple-700",
      "bg-pink-100 text-pink-700"
    ];
    
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  // Render contact card
  const renderContactCard = (contact: Contact, inList: boolean = false) => (
    <div 
      key={contact.id}
      className={`border rounded-md p-4 flex flex-col h-full ${
        selectedContacts.includes(contact.id) && !inList
          ? "border-primary-500 bg-primary-50"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarFallback className={getAvatarColor(contact.fullName)}>
              {getInitials(contact.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{contact.fullName}</h3>
            <p className="text-sm text-neutral-500">{contact.jobTitle || ""}</p>
          </div>
        </div>
        
        {!inList && (
          <Checkbox 
            checked={selectedContacts.includes(contact.id)}
            onCheckedChange={() => toggleContactSelection(contact.id)}
            className="h-5 w-5"
          />
        )}
      </div>
      
      <div className="text-sm space-y-2 flex-grow">
        {contact.email && (
          <div className="flex items-center">
            <Mail size={14} className="text-neutral-400 mr-2" />
            <span className="text-neutral-600 truncate">{contact.email}</span>
          </div>
        )}
        
        {contact.location && (
          <div className="text-neutral-500 text-xs">
            {contact.location}
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between">
        {inList ? (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8 px-2 text-neutral-600"
            onClick={() => {
              const list = lists.find(l => l.id === activeListId);
              if (list) {
                setLists(lists.map(l => 
                  l.id === activeListId 
                    ? { ...l, contacts: l.contacts.filter(id => id !== contact.id) }
                    : l
                ));
                toast({
                  title: "Contact removed",
                  description: `${contact.fullName} removed from ${list.name}`,
                });
              }
            }}
          >
            <Trash2 size={14} className="mr-1" /> Remove
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8 px-2 text-neutral-600"
            onClick={() => toggleContactSelection(contact.id)}
          >
            {selectedContacts.includes(contact.id) ? "Deselect" : "Select"}
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-8 px-2 text-neutral-600"
          onClick={() => {
            toast({
              title: "AI Message",
              description: `Redirecting to AI Writer for ${contact.fullName}`,
            });
          }}
        >
          <Bot size={14} className="mr-1" /> Message
        </Button>
      </div>
    </div>
  );
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Contact Lists</h1>
        <p className="text-neutral-600">Organize your contacts into targeted lists for campaigns</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Contact Lists Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle>Your Lists</CardTitle>
              <CardDescription>
                {lists.length} saved contact lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lists.map(list => (
                  <div 
                    key={list.id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      activeListId === list.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-neutral-200 hover:border-primary-200 hover:bg-neutral-50"
                    }`}
                    onClick={() => setActiveListId(list.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{list.name}</div>
                        <div className="text-xs text-neutral-500 mt-1">{list.description}</div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {list.contacts.length}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {lists.length === 0 && (
                  <div className="text-center py-6 text-neutral-500">
                    <Users size={24} className="mx-auto mb-2 text-neutral-300" />
                    <p>No lists created yet</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setActiveListId(null)}
              >
                <Plus size={16} className="mr-2" /> Create New List
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>
                    {activeListId 
                      ? lists.find(list => list.id === activeListId)?.name 
                      : "All Contacts"}
                  </CardTitle>
                  <CardDescription>
                    {activeListId
                      ? lists.find(list => list.id === activeListId)?.description
                      : "Select contacts to add to a list"}
                  </CardDescription>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input
                      placeholder="Search contacts..."
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
                  
                  {selectedContacts.length > 0 && !activeListId && (
                    <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus size={16} className="mr-2" /> Create List
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create Contact List</DialogTitle>
                          <DialogDescription>
                            Create a new list with {selectedContacts.length} selected contacts
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleCreateList)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>List Name*</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Sales Prospects" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Brief description of this list" 
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
                              name="contacts"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Selected Contacts</FormLabel>
                                  <div className="border rounded-md p-2 bg-neutral-50">
                                    <div className="text-sm">
                                      {selectedContacts.length} contacts selected
                                    </div>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button type="submit">
                                Create List
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {activeListId && (
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDeleteList(activeListId)}
                    >
                      <Trash2 size={16} className="mr-2" /> Delete List
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoadingContacts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : (
                <>
                  {!activeListId && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={selectAllContacts}
                        disabled={filteredContacts.length === 0}
                      >
                        Select All
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearAllSelections}
                        disabled={selectedContacts.length === 0}
                      >
                        Clear Selection
                      </Button>
                      
                      {selectedContacts.length > 0 && (
                        <Badge className="bg-primary-500">
                          {selectedContacts.length} selected
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeListId 
                      ? (activeListContacts.length > 0 
                        ? activeListContacts.map((contact: Contact) => renderContactCard(contact, true))
                        : <div className="col-span-full text-center py-8 text-neutral-500">
                            This list doesn't have any contacts yet
                          </div>
                        )
                      : (filteredContacts.length > 0 
                        ? filteredContacts.map((contact: Contact) => renderContactCard(contact))
                        : <div className="col-span-full text-center py-8 text-neutral-500">
                            No contacts found matching your search
                          </div>
                        )
                    }
                  </div>
                </>
              )}
            </CardContent>
            
            <CardFooter className="border-t flex justify-between p-4">
              <div className="text-sm text-neutral-500">
                {activeListId 
                  ? `Showing ${activeListContacts?.length || 0} contacts in this list`
                  : `Showing ${filteredContacts?.length || 0} of ${contactsData?.contacts?.length || 0} contacts`
                }
              </div>
              
              {activeListId && activeListContacts?.length > 0 && (
                <Button variant="outline" size="sm">
                  <Download size={14} className="mr-1" /> Export List
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
