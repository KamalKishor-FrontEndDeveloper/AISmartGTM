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
  List,
  Upload,
  Loader2,
  Search
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
  isVerifyingEmail?: boolean;
  isEmailFinding?: boolean;
  findingEmailId?: number | null;
  onEmailFind?: (contact: Contact) => void;
  handleAIWriter: (contact: Contact) => void;
  onVerifyEmail?: (contact: Contact) => void;
  handleCRMExport: (contact: Contact) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
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
  isRevealingEmail,
  isVerifyingEmail = false,
  isEmailFinding = false,
  findingEmailId = null,
  onEmailFind,
  onVerifyEmail,
  handleAIWriter,
  handleCRMExport,
  pageSize = 10, // Default page size
  onPageSizeChange
}: ContactsTableProps) {

  const paginatedContacts = contacts.slice(0, pageSize); // Added pagination

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
            <TableHead>Email Verified</TableHead> {/* Added Email Verified column */}
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
          {paginatedContacts.map((contact) => ( // Using paginatedContacts
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
                  {companies.find(c => c.id === contact.companyId)?.name || contact.companyName || "N/A"}
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
                  {contact.email ? contact.email : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEmailFind?.(contact)}
                      disabled={!contact.fullName || isEmailFinding}
                      className="text-primary-500 hover:text-primary-600 p-0 h-auto font-normal"
                    >
                      {isEmailFinding && findingEmailId === contact.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Finding...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Find Email
                          <span className="ml-1 text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">
                            1 credit
                          </span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {contact.emailVerified ? (
                    <Badge variant="success">Verified</Badge>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onVerifyEmail?.(contact)}
                      disabled={!contact.email || !onVerifyEmail || isVerifyingEmail}
                    >
                      {isVerifyingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Email"
                      )}
                    </Button>
                  )}
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
                    <DropdownMenuItem onClick={() => handleAIWriter(contact)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      AI Writer
                    </DropdownMenuItem>
                    {contact.linkedInUrl && (
                      <DropdownMenuItem onClick={() => window.open(contact.linkedInUrl, '_blank')}>
                        <Linkedin className="w-4 h-4 mr-2" />
                        Connect on LinkedIn
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleCRMExport(contact)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Export to CRM
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteContact(contact)}>
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
      <div className="flex items-center space-x-4 mt-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Show:</span>
          <select 
            className="h-8 w-20 rounded-md border border-gray-200 text-sm" 
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {contacts.length > 0 ? 1 : 0} - {Math.min(paginatedContacts.length, pageSize)} of {contacts.length}
        </span>
      </div>
    </div>
  );
}