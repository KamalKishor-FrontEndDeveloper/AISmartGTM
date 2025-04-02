import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CRMType } from './CRMIntegrations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Company } from "@shared/schema";

interface ExportCompaniesButtonProps {
  selectedCompanyIds: number[];
  disabled?: boolean;
}

export function ExportCompaniesButton({ selectedCompanyIds, disabled }: ExportCompaniesButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState<CRMType | null>(null);

  // Export companies mutation
  const exportCompaniesMutation = useMutation({
    mutationFn: async () => {
      if (!destination) throw new Error("No destination selected");

      return apiRequest('/api/crm/export/companies', {
        method: 'POST',
        body: JSON.stringify({ destination, companyIds: selectedCompanyIds })
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Export Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/credits'] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export companies. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleExport = () => {
    if (!destination) {
      toast({
        title: "No Destination Selected",
        description: "Please select a CRM destination",
        variant: "destructive"
      });
      return;
    }

    exportCompaniesMutation.mutate();
  };

  // Whether the button should be visible
  const isVisible = selectedCompanyIds.length > 0;

  if (!isVisible) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          disabled={disabled || exportCompaniesMutation.isPending}
        >
          <Upload className="mr-2 h-4 w-4" />
          Export {selectedCompanyIds.length} {selectedCompanyIds.length === 1 ? 'Company' : 'Companies'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Companies to CRM</DialogTitle>
          <DialogDescription>
            Export {selectedCompanyIds.length} selected {selectedCompanyIds.length === 1 ? 'company' : 'companies'} to your preferred CRM.
            This will cost 5 credits.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Select Destination</h4>
              <Select
                value={destination || ""}
                onValueChange={(value) => setDestination(value as CRMType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a CRM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CRMType.Salesforce}>Salesforce</SelectItem>
                  <SelectItem value={CRMType.HubSpot}>HubSpot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={!destination || exportCompaniesMutation.isPending}
          >
            {exportCompaniesMutation.isPending ? "Exporting..." : "Export Companies"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}