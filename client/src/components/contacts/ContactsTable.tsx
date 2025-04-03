
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
  Star,
  Briefcase,
  Users,
  Linkedin,
  Twitter,
  Facebook,
  MessageSquare,
  Building2,
  UserCircle,
  List
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
          <TableRow className="bg-gray-50">
            <TableHead className="w-[30px]">
              <input type="checkbox" className="rounded border-gray-300" />
            </TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Company Emails</TableHead>
            <TableHead>Contact Emails</TableHead>
            <TableHead>Company Phones</TableHead>
            <TableHead>Contact Phones</TableHead>
            <TableHead>Contact Socials</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Contact Location</TableHead>
            <TableHead>Seniority</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Company Location</TableHead>
            <TableHead>Employee Size</TableHead>
            <TableHead>Company Socials</TableHead>
            <TableHead>AI Writer</TableHead>
            <TableHead>Date Researched</TableHead>
            <TableHead>Lists</TableHead>
            <TableHead>CRM</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="hover:bg-gray-50">
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
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  {contact.website || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {contact.companyEmail || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {contact.email || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {contact.companyPhone || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {contact.phone || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {contact.linkedInUrl && (
                    <Linkedin className="w-4 h-4 text-blue-600" />
                  )}
                  {contact.twitterUrl && (
                    <Twitter className="w-4 h-4 text-blue-400" />
                  )}
                </div>
              </TableCell>
              <TableCell>{contact.industry || "N/A"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {contact.location || "N/A"}
                </div>
              </TableCell>
              <TableCell>{contact.seniority || "N/A"}</TableCell>
              <TableCell>{contact.department || "N/A"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  {contact.companyLocation || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  {contact.employeeSize || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {contact.companySocials?.linkedin && (
                    <Linkedin className="w-4 h-4 text-blue-600" />
                  )}
                  {contact.companySocials?.twitter && (
                    <Twitter className="w-4 h-4 text-blue-400" />
                  )}
                  {contact.companySocials?.facebook && (
                    <Facebook className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </TableCell>
              <TableCell>
                {contact.dateResearched ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(contact.dateResearched).toLocaleDateString()}
                  </div>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-muted-foreground" />
                  {contact.lists?.join(", ") || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {contact.crmSource || "None"}
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
