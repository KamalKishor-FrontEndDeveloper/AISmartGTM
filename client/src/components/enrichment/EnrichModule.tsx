import { useState } from "react";
import SearchPanel from "./SearchPanel";
import ResultsTable from "./ResultsTable";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CoinsIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type EnrichmentOption = {
  id: string;
  label: string;
  creditCost: number;
  checked: boolean;
};

export type SearchResult = {
  id: number;
  fullName: string;
  jobTitle: string;
  companyId: number | null;
  companyName?: string;
  email: string | null;
  isEnriched: boolean;
  location: string | null;
};

export default function EnrichModule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  
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
  
  // Query for recent searches (would be implemented in a real app)
  const { data: recentSearches } = useQuery({
    queryKey: ["/api/enrich/recent-searches"],
    queryFn: async () => {
      // In a real app, this would fetch from the API
      return {
        searches: [
          { id: 1, query: "VP of Marketing - TechCorp", results: 15, date: new Date(Date.now() - 172800000) },
          { id: 2, query: "CTO - InnovateSoft", results: 8, date: new Date(Date.now() - 259200000) },
          { id: 3, query: "Sales Director - Finance", results: 23, date: new Date(Date.now() - 432000000) }
        ]
      };
    },
    staleTime: Infinity // Static data for demo
  });
  
  // Enrichment options
  const [enrichmentOptions, setEnrichmentOptions] = useState<EnrichmentOption[]>([
    { id: "email", label: "Email Addresses", creditCost: 2, checked: true },
    { id: "phone", label: "Phone Numbers", creditCost: 3, checked: true },
    { id: "social", label: "Social Profiles", creditCost: 1, checked: false },
    { id: "company", label: "Company Details", creditCost: 4, checked: false }
  ]);
  
  const toggleEnrichmentOption = (id: string) => {
    setEnrichmentOptions(options => 
      options.map(option => 
        option.id === id ? { ...option, checked: !option.checked } : option
      )
    );
  };
  
  // Search contacts mutation
  const searchMutation = useMutation({
    mutationFn: async (filters: any) => {
      const res = await apiRequest("POST", "/api/enrich/search", filters);
      return res.json();
    },
    onSuccess: (data) => {
      setSearchResults(data.results);
      queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
    },
    onSettled: () => {
      setIsSearching(false);
    }
  });
  
  // Reveal email mutation
  const revealEmailMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const res = await apiRequest("POST", "/api/enrich/reveal-email", { contactId });
      return res.json();
    },
    onSuccess: (data, contactId) => {
      // Update the contact in the search results
      setSearchResults(results => 
        results.map(result => 
          result.id === contactId 
            ? { ...result, email: data.email, isEnriched: true } 
            : result
        )
      );
      queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
    }
  });
  
  // Handle search submission
  const handleSearch = (filters: any) => {
    setIsSearching(true);
    searchMutation.mutate(filters);
  };
  
  // Handle email reveal
  const handleRevealEmail = (contactId: number) => {
    revealEmailMutation.mutate(contactId);
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(searchResults.length / resultsPerPage);
  const paginatedResults = searchResults.slice(
    (currentPage - 1) * resultsPerPage, 
    currentPage * resultsPerPage
  );
  
  // Format date for recent searches
  const formatDate = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days ago`;
  };
  
  const credits = creditsData?.credits || user?.credits || 0;
  const maxCredits = 200; // Arbitrary max for progress bar

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Enrich Contact Data</h1>
        <p className="text-neutral-600">Find and enrich B2B contact data with a few clicks</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Panel and Results */}
        <div className="col-span-2">
          <SearchPanel onSearch={handleSearch} isSearching={isSearching} />
          
          {searchResults.length > 0 && (
            <ResultsTable 
              results={paginatedResults}
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={searchResults.length}
              onPageChange={setCurrentPage}
              onRevealEmail={handleRevealEmail}
              isRevealingEmail={revealEmailMutation.isPending}
            />
          )}
        </div>
        
        {/* Sidebar Information Panels */}
        <div className="lg:col-span-1">
          {/* Credits Card */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Your Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-600 text-sm">Available Credits:</span>
                <span className="font-semibold text-lg">{credits}</span>
              </div>
              <Progress className="h-2.5 mb-4" value={(credits / maxCredits) * 100} />
              <Button className="w-full">
                <CoinsIcon size={16} className="mr-2" />
                Buy More Credits
              </Button>
            </CardContent>
          </Card>
          
          {/* Enrichment Options */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Enrichment Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enrichmentOptions.map(option => (
                  <div key={option.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox 
                        id={option.id} 
                        checked={option.checked}
                        onCheckedChange={() => toggleEnrichmentOption(option.id)}
                      />
                      <label htmlFor={option.id} className="ml-2 text-sm">
                        {option.label}
                      </label>
                    </div>
                    <span className="text-xs text-neutral-500">{option.creditCost} credits</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Searches */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Recent Searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSearches?.searches.map((search: any) => (
                  <div key={search.id} className="p-2 hover:bg-neutral-50 rounded-md cursor-pointer">
                    <div className="text-sm font-medium">{search.query}</div>
                    <div className="text-xs text-neutral-500">
                      {search.results} results • {formatDate(search.date)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
