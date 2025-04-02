import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { ChevronDown, Plus } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
}

interface FilterCategoryProps {
  title: string;
  options?: FilterOption[];
  children?: React.ReactNode;
}

function FilterCategory({ title, options, children }: FilterCategoryProps) {
  return (
    <AccordionItem value={title.toLowerCase()}>
      <AccordionTrigger className="py-2">
        <span className="text-sm font-medium">{title}</span>
      </AccordionTrigger>
      <AccordionContent className="pt-1 pb-3">
        {children ? children : (
          <div className="space-y-1">
            {options?.map(option => (
              <div key={option.id} className="flex items-center">
                <button
                  className="text-left w-full py-1 px-2 text-sm hover:bg-gray-100 rounded"
                >
                  {option.label}
                </button>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function ContactFilters() {
  const companyOptions = [
    { id: "1", label: "Acme Corp" },
    { id: "2", label: "Globex Corporation" },
    { id: "3", label: "Soylent Corp" },
    { id: "4", label: "Initech" }
  ];

  const titleOptions = [
    { id: "1", label: "Software Engineer" },
    { id: "2", label: "Product Manager" },
    { id: "3", label: "Marketing Director" },
    { id: "4", label: "CEO" }
  ];

  const industryOptions = [
    { id: "1", label: "Technology" },
    { id: "2", label: "Healthcare" },
    { id: "3", label: "Finance" },
    { id: "4", label: "Manufacturing" }
  ];

  const seniorityOptions = [
    { id: "1", label: "Entry Level" },
    { id: "2", label: "Mid-Level" },
    { id: "3", label: "Senior" },
    { id: "4", label: "Executive" }
  ];

  const departmentOptions = [
    { id: "1", label: "Engineering" },
    { id: "2", label: "Sales" },
    { id: "3", label: "Marketing" },
    { id: "4", label: "Finance" }
  ];

  const locationOptions = [
    { id: "1", label: "New York" },
    { id: "2", label: "San Francisco" },
    { id: "3", label: "London" },
    { id: "4", label: "Berlin" }
  ];

  const keywordOptions = [
    { id: "1", label: "AI" },
    { id: "2", label: "Blockchain" },
    { id: "3", label: "Cloud" },
    { id: "4", label: "Digital Transformation" }
  ];

  const employeeSizeOptions = [
    { id: "1", label: "1-10" },
    { id: "2", label: "11-50" },
    { id: "3", label: "51-200" },
    { id: "4", label: "201-500" },
    { id: "5", label: "501-1000" },
    { id: "6", label: "1001+" }
  ];

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Filters</h3>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <div className="flex items-center justify-center">
              <img className="w-4 h-4 mr-1" src="/icon.png" alt="Logo" />
              <span>Manage Default Lists</span>
            </div>
          </Button>
        </div>
      </div>
      
      <Accordion type="multiple" defaultValue={["company"]}>
        <FilterCategory title="Company" options={companyOptions} />
        <FilterCategory title="Full Name" />
        <FilterCategory title="Titles" options={titleOptions} />
        <FilterCategory title="Seniority" options={seniorityOptions} />
        <FilterCategory title="Department" options={departmentOptions} />
        <FilterCategory title="Location" options={locationOptions} />
        <FilterCategory title="Keywords" options={keywordOptions} />
        <FilterCategory title="Industry" options={industryOptions} />
        <FilterCategory title="Employee Size" options={employeeSizeOptions} />
      </Accordion>
      
      <Button variant="outline" size="sm" className="w-full mt-3">
        <div className="flex items-center justify-center">
          <span>Search</span>
        </div>
      </Button>
    </div>
  );
}