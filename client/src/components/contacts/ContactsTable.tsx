
import React from "react";
import { Contact, Company } from "@shared/schema";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MoreHorizontal, 
  FileText, 
  Trash2, 
  Pencil, 
  Sparkles, 
  Linkedin,
  MessageSquare,
  Send,
  Link,
  Globe,
  MapPin,
  Calendar
} from "lucide-react";

interface ContactsTableProps {
  contacts: Contact[];
  companies: Company[];
  onEmailReveal: (contactId: number) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
  onViewDetails: (contact: Contact) => void;
  onEnrichContact?: (contact: Contact) => void;
  onSendLinkedInRequest?: (contact: Contact) => void;
  onSendEmail?: (contact: Contact) => void;
  onWriteMessage?: (contact: Contact) => void;
  isRevealingEmail: boolean;
}

export default function ContactsTable({
  contacts,
  companies,
  onEmailReveal,
  onEditContact,
  onDeleteContact,
  onViewDetails,
  onEnrichContact,
  onSendLinkedInRequest,
  onSendEmail,
  onWriteMessage,
  isRevealingEmail
}: ContactsTableProps) {
  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">
              <input type="checkbox" className="rounded border-gray-300" />
            </TableHead>
            <TableHead className="w-[250px]">Name</TableHead>
            <TableHead className="w-[200px]">Company</TableHead>
            <TableHead className="w-[150px]">Contact Info</TableHead>
            <TableHead className="w-[150px]">Location</TableHead>
            <TableHead className="w-[150px]">LinkedIn</TableHead>
            <TableHead className="w-[120px]">Last Contact</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>
                <input type="checkbox" className="rounded border-gray-300" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    {contact.profileImageUrl ? (
                      <img src={contact.profileImageUrl} alt={contact.fullName} />
                    ) : (
                      <div className="bg-primary/10 text-primary w-full h-full flex items-center justify-center text-sm font-medium">
                        {contact.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium">{contact.fullName}</div>
                    <div className="text-sm text-muted-foreground">{contact.jobTitle}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  {contact.companyName}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {contact.email ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEmailReveal(contact.id)}
                      disabled={isRevealingEmail}
                    >
                      Reveal Email
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {contact.location}
                </div>
              </TableCell>
              <TableCell>
                {contact.linkedInUrl ? (
                  <a
                    href={contact.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <Linkedin className="w-4 h-4" />
                    Profile
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not available</span>
                )}
              </TableCell>
              <TableCell>
                {contact.lastContactedDate ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(contact.lastContactedDate).toLocaleDateString()}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Never</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={contact.isEnriched ? "success" : "default"}>
                  {contact.isEnriched ? "Enriched" : "Basic"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(contact)}>
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditContact(contact)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {onEnrichContact && (
                      <DropdownMenuItem onClick={() => onEnrichContact(contact)}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Enrich Data
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onSendLinkedInRequest && (
                      <DropdownMenuItem onClick={() => onSendLinkedInRequest(contact)}>
                        <Linkedin className="w-4 h-4 mr-2" />
                        Send Connection
                      </DropdownMenuItem>
                    )}
                    {onSendEmail && (
                      <DropdownMenuItem onClick={() => onSendEmail(contact)}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                    )}
                    {onWriteMessage && (
                      <DropdownMenuItem onClick={() => onWriteMessage(contact)}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Write Message
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteContact(contact)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
