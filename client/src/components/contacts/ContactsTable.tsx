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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Mail, MoreHorizontal, FileText, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface ContactsTableProps {
  contacts: Contact[];
  companies: Company[];
  onEmailReveal: (contactId: number) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
  onViewDetails: (contact: Contact) => void;
  isRevealingEmail: boolean;
}

export default function ContactsTable({
  contacts,
  companies,
  onEmailReveal,
  onEditContact,
  onDeleteContact,
  onViewDetails,
  isRevealingEmail
}: ContactsTableProps) {
  // Get company name by ID
  const getCompanyName = (companyId?: number | null) => {
    if (!companyId) return null;
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : null;
  };

  // Format email display
  const formatEmail = (contact: Contact) => {
    if (!contact.email) {
      return (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onEmailReveal(contact.id)}
          disabled={isRevealingEmail}
        >
          {isRevealingEmail ? "Revealing..." : "Add Email"}
        </Button>
      );
    }
    
    return (
      <div className="flex items-center">
        <Mail className="h-4 w-4 mr-2 text-blue-500" />
        <span className="text-sm">{contact.email}</span>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <input type="checkbox" className="rounded" />
            </TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Company Emails</TableHead>
            <TableHead>Contact Emails</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const company = companies.find(c => c.id === contact.companyId);
            
            return (
              <TableRow key={contact.id}>
                <TableCell>
                  <input type="checkbox" className="rounded" />
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/contacts/${contact.id}`} className="text-blue-500 hover:underline">
                    {contact.fullName}
                  </Link>
                </TableCell>
                <TableCell>{contact.jobTitle || "-"}</TableCell>
                <TableCell>
                  {company ? (
                    <div className="flex items-center">
                      <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                        {company.name.charAt(0)}
                      </span>
                      <Link href={`/dashboard/companies/${company.id}`} className="text-blue-500 hover:underline">
                        {company.name}
                      </Link>
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  {company?.website ? (
                    <a 
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  {company ? (
                    <Badge variant="outline" className="bg-gray-50">
                      {company.name.toLowerCase()}@example.com
                    </Badge>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  {formatEmail(contact)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetails(contact)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditContact(contact)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteContact(contact)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}