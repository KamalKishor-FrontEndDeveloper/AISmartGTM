import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bot, 
  Wand2, 
  Copy, 
  Loader2, 
  RefreshCcw, 
  Send, 
  Sparkles,
  Coins,
  Mail,
  LinkedinIcon
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type MessageTemplate = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
};

export default function AiWriterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [messageTemplate, setMessageTemplate] = useState<string>("introduction");
  const [messageTone, setMessageTone] = useState<string>("professional");
  const [generatedMessage, setGeneratedMessage] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [showEmailDialog, setShowEmailDialog] = useState<boolean>(false);
  const [showLinkedInDialog, setShowLinkedInDialog] = useState<boolean>(false);
  
  // Parse URL parameters to pre-select contact if coming from contacts page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contactParam = urlParams.get('contact');
    
    if (contactParam) {
      try {
        const contactData = JSON.parse(decodeURIComponent(contactParam));
        if (contactData && contactData.id) {
          setSelectedContact(contactData.id);
          
          // Set a custom prompt based on the contact information
          if (contactData.fullName && (contactData.jobTitle || contactData.companyName)) {
            const promptContext = `This is for ${contactData.fullName}${contactData.jobTitle ? `, who is a ${contactData.jobTitle}` : ''}${contactData.companyName ? ` at ${contactData.companyName}` : ''}.`;
            
            if (messageTemplate === 'custom') {
              setCustomPrompt(promptContext);
            }
          }
        }
      } catch (e) {
        console.error("Error parsing contact data from URL", e);
      }
    }
  }, [location]);
  
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
  
  // Get user's credit balance
  const { data: creditsData } = useQuery({
    queryKey: ["/api/user/credits"],
    queryFn: async () => {
      const res = await fetch("/api/user/credits", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch credits");
      return res.json();
    }
  });
  
  // Generate AI message mutation
  const generateMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContact) {
        throw new Error("Please select a contact");
      }
      
      return apiRequest("/api/ai-writer/generate", {
        method: "POST",
        body: JSON.stringify({
          contactId: selectedContact,
          purpose: messageTemplate,
          tone: messageTone,
          customPrompt: customPrompt
        })
      });
    },
    onSuccess: (data) => {
      setGeneratedMessage(data.message);
      toast({
        title: "Message generated",
        description: `Message generated successfully (${data.creditsUsed} credits used)`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate message",
        variant: "destructive"
      });
    }
  });
  
  // Copy message to clipboard
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast({
      title: "Copied to clipboard",
      description: "Message copied to clipboard",
    });
  };
  
  // Send Email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContact || !generatedMessage) {
        throw new Error("Contact and message are required");
      }
      
      return apiRequest("/api/ai-writer/send-email", {
        method: "POST",
        body: JSON.stringify({
          contactId: selectedContact,
          message: generatedMessage,
          subject: emailSubject
        })
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Email sent",
        description: data.message || "Email sent successfully",
      });
      setShowEmailDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    }
  });
  
  // Send LinkedIn connection request mutation
  const sendLinkedInRequestMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContact || !generatedMessage) {
        throw new Error("Contact and message are required");
      }
      
      return apiRequest("/api/contact/linkedin-connect", {
        method: "POST",
        body: JSON.stringify({
          contactId: selectedContact,
          message: generatedMessage
        })
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Connection request sent",
        description: data.message || "LinkedIn connection request sent successfully",
      });
      setShowLinkedInDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send LinkedIn connection request",
        variant: "destructive"
      });
    }
  });
  
  // Message templates
  const messageTemplates: MessageTemplate[] = [
    {
      id: "introduction",
      name: "Introduction",
      description: "First contact message to introduce yourself and your company",
      icon: <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-100 text-blue-700"><Bot size={20} /></AvatarFallback></Avatar>
    },
    {
      id: "followup",
      name: "Follow-up",
      description: "Follow up on a previous conversation or meeting",
      icon: <Avatar className="h-10 w-10"><AvatarFallback className="bg-green-100 text-green-700"><RefreshCcw size={20} /></AvatarFallback></Avatar>
    },
    {
      id: "proposal",
      name: "Proposal",
      description: "Send a business proposal or offering",
      icon: <Avatar className="h-10 w-10"><AvatarFallback className="bg-amber-100 text-amber-700"><Send size={20} /></AvatarFallback></Avatar>
    },
    {
      id: "custom",
      name: "Custom",
      description: "Create a completely custom message",
      icon: <Avatar className="h-10 w-10"><AvatarFallback className="bg-purple-100 text-purple-700"><Sparkles size={20} /></AvatarFallback></Avatar>
    }
  ];
  
  // Get selected contact details
  const selectedContactDetails = contactsData?.contacts?.find(
    (contact: any) => contact.id === selectedContact
  );
  
  // Get credit info
  const credits = creditsData?.credits || user?.credits || 0;
  const messageCost = 3; // Credits per message generation
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">AI Message Writer</h1>
        <p className="text-neutral-600">Generate personalized messages for your contacts using AI</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Contact</CardTitle>
              <CardDescription>Choose who to write to</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedContact?.toString() || ""}
                onValueChange={(value) => setSelectedContact(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingContacts ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : (
                    contactsData?.contacts?.map((contact: any) => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.fullName} {contact.jobTitle ? `- ${contact.jobTitle}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {selectedContactDetails && (
                <div className="mt-4 p-3 bg-neutral-50 rounded-md text-sm">
                  <div className="font-medium">{selectedContactDetails.fullName}</div>
                  {selectedContactDetails.jobTitle && (
                    <div className="text-neutral-600">{selectedContactDetails.jobTitle}</div>
                  )}
                  {selectedContactDetails.email && (
                    <div className="text-neutral-500 text-xs mt-1">{selectedContactDetails.email}</div>
                  )}
                  {selectedContactDetails.companyName && (
                    <div className="text-neutral-500 text-xs">{selectedContactDetails.companyName}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Message Template */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Message Type</CardTitle>
              <CardDescription>Select a template for your message</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messageTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors flex items-start space-x-3 ${
                      messageTemplate === template.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-neutral-200 hover:border-primary-200 hover:bg-neutral-50"
                    }`}
                    onClick={() => setMessageTemplate(template.id)}
                  >
                    {template.icon}
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-neutral-500">{template.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {messageTemplate === "custom" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Custom Instructions
                  </label>
                  <Textarea
                    placeholder="Describe what kind of message you want to generate..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Message Tone */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tone</CardTitle>
              <CardDescription>How should your message sound?</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={messageTone}
                onValueChange={setMessageTone}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
            <CardFooter className="border-t pt-4 pb-0 px-6">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center text-sm text-neutral-500">
                  <Coins size={14} className="mr-1" />
                  <span>{messageCost} credits per generation</span>
                </div>
                <div className="text-sm text-neutral-500">
                  Available: <span className="font-medium">{credits}</span> credits
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Message Output */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Generated Message</CardTitle>
                  <CardDescription>
                    {generatedMessage ? "Your AI-generated message is ready" : "Generate a personalized message"}
                  </CardDescription>
                </div>
                {generatedMessage && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={handleCopyMessage}>
                          <Copy size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy to clipboard</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="flex-grow">
              <div className="bg-neutral-50 rounded-md p-4 h-full min-h-[400px]">
                {generatedMessage ? (
                  <div className="whitespace-pre-line">{generatedMessage}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <Bot size={48} className="text-neutral-300" />
                    <div>
                      <p className="text-neutral-500">Your AI-generated message will appear here</p>
                      <p className="text-neutral-400 text-sm mt-1">
                        Select a contact and message type to get started
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="border-t pt-4 flex-col space-y-4">
              <div className="flex justify-between w-full">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedMessage("")}
                  disabled={!generatedMessage || generateMessageMutation.isPending}
                >
                  <RefreshCcw size={16} className="mr-2" />
                  Reset
                </Button>
                
                <Button
                  onClick={() => generateMessageMutation.mutate()}
                  disabled={!selectedContact || generateMessageMutation.isPending || credits < messageCost}
                >
                  {generateMessageMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} className="mr-2" />
                      Generate Message
                    </>
                  )}
                </Button>
              </div>
              
              {/* Message Action Buttons */}
              {generatedMessage && (
                <div className="w-full flex flex-col space-y-2">
                  <div className="w-full h-px bg-neutral-200"></div>
                  <div className="flex justify-between gap-2">
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      disabled={!selectedContactDetails?.email}
                      onClick={() => setShowEmailDialog(true)}
                    >
                      <Mail size={16} className="mr-2" />
                      Send Email
                    </Button>
                    
                    <Button 
                      variant="secondary"
                      className="flex-1"
                      disabled={!selectedContactDetails?.linkedInUrl}
                      onClick={() => setShowLinkedInDialog(true)}
                    >
                      <LinkedinIcon size={16} className="mr-2" />
                      LinkedIn Connect
                    </Button>
                  </div>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Message Examples and Templates */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Message Examples</CardTitle>
            <CardDescription>Browse example messages to inspire your outreach</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="introduction">
              <TabsList className="mb-4">
                <TabsTrigger value="introduction">Introduction</TabsTrigger>
                <TabsTrigger value="followup">Follow-up</TabsTrigger>
                <TabsTrigger value="proposal">Proposal</TabsTrigger>
              </TabsList>
              
              <TabsContent value="introduction" className="bg-neutral-50 rounded-md p-4">
                <div className="whitespace-pre-line">
                  {`Hi [First Name],

I noticed your work at [Company] and was impressed by your achievements as [Job Title].

Our platform helps [brief benefit statement relevant to recipient's role]. Companies like [similar company] have seen [specific result] after implementing our solution.

Would you be open to a quick 15-minute call next week to discuss how we might be able to help [Company] achieve similar results?

Best regards,
[Your Name]`}
                </div>
              </TabsContent>
              
              <TabsContent value="followup" className="bg-neutral-50 rounded-md p-4">
                <div className="whitespace-pre-line">
                  {`Hi [First Name],

I hope this message finds you well. I wanted to follow up on our previous conversation about [topic discussed].

Have you had a chance to consider the points we discussed? I'd be happy to provide any additional information that might be useful for your decision-making process.

Would you be available for a quick call next week to discuss next steps?

Best regards,
[Your Name]`}
                </div>
              </TabsContent>
              
              <TabsContent value="proposal" className="bg-neutral-50 rounded-md p-4">
                <div className="whitespace-pre-line">
                  {`Hi [First Name],

Following our conversation about [topic], I've put together a proposal for how [Your Company] can help [Their Company] achieve [specific goal].

Our solution provides:
- [Key benefit 1]
- [Key benefit 2]
- [Key benefit 3]

Based on our analysis, we estimate that implementing this would result in [specific outcome/ROI].

I'd welcome the opportunity to discuss this proposal in more detail. Would you be available for a 30-minute call this week?

Best regards,
[Your Name]`}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send this message to {selectedContactDetails?.fullName} via email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="p-2 border rounded bg-neutral-50">
                {selectedContactDetails?.email}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input 
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter subject line"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <div className="p-3 border rounded max-h-[200px] overflow-y-auto whitespace-pre-line">
                {generatedMessage}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => sendEmailMutation.mutate()}
              disabled={!emailSubject || sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={16} className="mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* LinkedIn Dialog */}
      <Dialog open={showLinkedInDialog} onOpenChange={setShowLinkedInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send LinkedIn Connection</DialogTitle>
            <DialogDescription>
              Send a connection request to {selectedContactDetails?.fullName} on LinkedIn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">LinkedIn Profile</label>
              <div className="p-2 border rounded bg-neutral-50 break-all text-sm">
                {selectedContactDetails?.linkedInUrl}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Connection Message</label>
              <div className="p-3 border rounded max-h-[200px] overflow-y-auto whitespace-pre-line">
                {generatedMessage}
              </div>
              <p className="text-xs text-neutral-500">
                Note: LinkedIn limits connection messages to 300 characters.
                The message will be truncated if it exceeds this limit.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkedInDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => sendLinkedInRequestMutation.mutate()}
              disabled={sendLinkedInRequestMutation.isPending}
            >
              {sendLinkedInRequestMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <LinkedinIcon size={16} className="mr-2" />
                  Send Connection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
