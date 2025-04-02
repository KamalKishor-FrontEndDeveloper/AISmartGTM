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
import { Contact } from "@shared/schema";

interface ExportContactsButtonProps {
  selectedContactIds: number[];
  disabled?: boolean;
}

export function ExportContactsButton({ selectedContactIds, disabled }: ExportContactsButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState<CRMType | null>(null);

  // Export contacts mutation
  const exportContactsMutation = useMutation({
    mutationFn: async () => {
      if (!destination) throw new Error("No destination selected");

      return apiRequest('/api/crm/export/contacts', {
        method: 'POST',
        body: JSON.stringify({ destination, contactIds: selectedContactIds })
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Export Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/credits'] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export contacts. Please try again.",
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

    exportContactsMutation.mutate();
  };

  // Whether the button should be visible
  const isVisible = selectedContactIds.length > 0;

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
          disabled={disabled || exportContactsMutation.isPending}
        >
          <Upload className="mr-2 h-4 w-4" />
          Export {selectedContactIds.length} {selectedContactIds.length === 1 ? 'Contact' : 'Contacts'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Contacts to CRM</DialogTitle>
          <DialogDescription>
            Export {selectedContactIds.length} selected {selectedContactIds.length === 1 ? 'contact' : 'contacts'} to your preferred CRM.
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
            disabled={!destination || exportContactsMutation.isPending}
          >
            {exportContactsMutation.isPending ? "Exporting..." : "Export Contacts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}