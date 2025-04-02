import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  Coins
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MessageTemplate = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
};

export default function AiWriterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [messageTemplate, setMessageTemplate] = useState<string>("introduction");
  const [messageTone, setMessageTone] = useState<string>("professional");
  const [generatedMessage, setGeneratedMessage] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  
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
      
      const res = await apiRequest("POST", "/api/ai-writer/generate", {
        contactId: selectedContact,
        purpose: messageTemplate,
        tone: messageTone,
        customPrompt: customPrompt
      });
      
      return res.json();
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
            
            <CardFooter className="border-t pt-4">
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
    </div>
  );
}
