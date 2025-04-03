
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
  Phone,
  MapPin,
  Globe,
  Building,
  Calendar,
  Tag,
  Star
} from "lucide-react";

interface ContactsTableProps {
  contacts: Contact[];
  companies: Company[];
  onEmailReveal: (contactId: number) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
  onViewDetails: (contact: Contact) => void;
  onEnrichContact?: (contact: Contact) => void;
  onSendEmail?: (contact: Contact) => void;
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
  onSendEmail,
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
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Last Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead></TableHead>
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
                  <div className="font-medium">{contact.fullName}</div>
                </div>
              </TableCell>
              <TableCell>{contact.jobTitle}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  {contact.companyName}
                </div>
              </TableCell>
              <TableCell>
                {contact.email ? (
                  <div className="flex items-center gap-2">
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
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {contact.phone || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {contact.location || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  {contact.industry || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  <Tag className="w-3 h-3 mr-1" />
                  {contact.source || "Manual"}
                </Badge>
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
                <Badge variant={contact.status === "Active" ? "success" : "default"}>
                  {contact.status || "New"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  {contact.score || "0"}
                </div>
              </TableCell>
              <TableCell>
                <Avatar className="w-6 h-6">
                  <div className="bg-blue-100 text-blue-700 w-full h-full flex items-center justify-center text-xs font-medium">
                    ME
                  </div>
                </Avatar>
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
                    {onSendEmail && contact.email && (
                      <DropdownMenuItem onClick={() => onSendEmail(contact)}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
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
