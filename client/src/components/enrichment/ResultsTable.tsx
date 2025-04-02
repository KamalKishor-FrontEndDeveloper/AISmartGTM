import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Mail, 
  UserPlus, 
  Bot, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchResult } from "./EnrichModule";

interface ResultsTableProps {
  results: SearchResult[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
  onRevealEmail: (contactId: number) => void;
  isRevealingEmail: boolean;
}

export default function ResultsTable({ 
  results, 
  currentPage, 
  totalPages, 
  totalResults,
  onPageChange,
  onRevealEmail,
  isRevealingEmail
}: ResultsTableProps) {
  const [revealingId, setRevealingId] = useState<number | null>(null);
  
  const handleRevealEmail = (contactId: number) => {
    setRevealingId(contactId);
    onRevealEmail(contactId);
  };
  
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
      "bg-secondary-100 text-secondary-700",
      "bg-amber-100 text-amber-700",
      "bg-green-100 text-green-700",
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700",
      "bg-pink-100 text-pink-700"
    ];
    
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
        <h3 className="font-medium">Search Results</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-neutral-600">{totalResults} results</span>
          <div className="border-l border-neutral-300 h-5"></div>
          <Button variant="link" className="text-sm text-primary-500 hover:text-primary-600 p-0">
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr className="bg-neutral-50">
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Company</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {results.map((contact) => (
              <tr key={contact.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={getAvatarColor(contact.fullName)}>
                        {getInitials(contact.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-neutral-900">{contact.fullName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                  {contact.jobTitle || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                  {contact.companyName || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {contact.email ? (
                    <span className="text-neutral-900">{contact.email}</span>
                  ) : (
                    <Button 
                      variant="link" 
                      onClick={() => handleRevealEmail(contact.id)}
                      disabled={isRevealingEmail && revealingId === contact.id}
                      className="text-primary-500 hover:text-primary-600 p-0 h-auto font-normal"
                    >
                      {isRevealingEmail && revealingId === contact.id ? (
                        <>
                          <Loader2 size={14} className="mr-1 animate-spin" /> Revealing...
                        </>
                      ) : (
                        <>
                          <Mail size={14} className="mr-1" /> Reveal Email
                          <span className="ml-1 text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">2 credits</span>
                        </>
                      )}
                    </Button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                  <div className="flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-primary-500">
                            <UserPlus size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save to contacts</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-primary-500">
                            <Bot size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>AI Message</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-primary-500">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Add to List</DropdownMenuItem>
                        <DropdownMenuItem>Export Contact</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-5 py-4 border-t border-neutral-200 flex items-center justify-between">
        <div className="flex items-center text-sm text-neutral-700">
          <span>Showing {(currentPage - 1) * results.length + 1}-{Math.min(currentPage * results.length, totalResults)} of {totalResults} results</span>
        </div>
        
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={14} />
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
            .map((page, index, array) => (
              <>
                {index > 0 && array[index - 1] !== page - 1 && (
                  <span key={`ellipsis-${page}`} className="px-3 py-1 rounded border border-neutral-300 text-neutral-600">
                    ...
                  </span>
                )}
                <Button
                  key={page}
                  variant={currentPage === page ? "secondary" : "outline"}
                  size="icon"
                  className={`h-8 w-8 ${currentPage === page ? "bg-primary-50 border-primary-500 text-primary-600" : ""}`}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              </>
            ))}
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
