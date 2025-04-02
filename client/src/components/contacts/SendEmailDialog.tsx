import { useState, useEffect } from "react";
import { Contact } from "@shared/schema";
import { User } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Sparkles } from "lucide-react";

interface SendEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  user: User | null;
  onGenerateAIMessage: (contact: Contact) => Promise<void>;
  isGeneratingMessage: boolean;
  generatedMessage: string;
}

export function SendEmailDialog({
  isOpen,
  onClose,
  contact,
  user,
  onGenerateAIMessage,
  isGeneratingMessage,
  generatedMessage,
}: SendEmailDialogProps) {
  
  useEffect(() => {
    if (!isOpen) {
      setMessage("");
    }
  }, [isOpen]);
  const [subject, setSubject] = useState<string>(`Introduction: ${user?.fullName || ""} from our company`);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (generatedMessage) {
      setMessage(generatedMessage);
    }
  }, [generatedMessage]);

  const queryClient = useQueryClient();

  const sendEmailMutation = useMutation({
    mutationFn: async ({ contactId, subject, message }: { contactId: number; subject: string; message: string }) => {
      return apiRequest("/api/email/send", {
        method: "POST",
        body: JSON.stringify({ contactId, subject, message }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
      toast({
        title: "Email Sent",
        description: `Your email to ${contact.fullName} has been sent successfully`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    if (!subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter an email subject",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter an email message",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      contactId: contact.id,
      subject,
      message,
    });
  };

  // Update message when generatedMessage changes
  useState(() => {
    if (generatedMessage) {
      setMessage(generatedMessage);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Send an email message to {contact.fullName} at {contact.email || "No email available"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-medium">{contact.fullName}</h4>
              <p className="text-sm text-gray-500">
                {contact.email ? contact.email : "No email address available"}
              </p>
            </div>
          </div>

          {!contact.email ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
              <p className="text-sm">
                This contact doesn't have an email address. Please use the "Reveal Email" or "Enrich" feature to find their email.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  disabled={sendEmailMutation.isPending}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium">Message</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateAIMessage(contact)}
                    disabled={isGeneratingMessage || sendEmailMutation.isPending}
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
                <textarea
                  className="w-full p-2 border border-gray-200 rounded-md min-h-[200px]"
                  placeholder={`Hi ${contact.fullName},\n\nI'd like to introduce myself...\n\nBest regards,\n${user?.fullName}`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sendEmailMutation.isPending}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    This will cost 3 credits to send an email
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sendEmailMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={sendEmailMutation.isPending || !contact.email}
            className={contact.email ? "bg-blue-500 hover:bg-blue-600" : ""}
          >
            {sendEmailMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Email"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}