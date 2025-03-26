import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Search, X } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
  options: { label: string; value: string }[];
}

interface QuickFilterProps {
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: Record<string, string>) => void;
  className?: string;
}

export function QuickFilter({
  searchPlaceholder = "Search...",
  filterOptions = [],
  onSearchChange,
  onFilterChange,
  className = "",
}: QuickFilterProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    onSearchChange(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setSearchValue("");
    setFilters({});
    onSearchChange("");
    onFilterChange({});
  };

  const hasActiveFilters = searchValue !== "" || Object.keys(filters).length > 0;

  return (
    <Card className={`shadow-none border-none ${className}`}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              className="pl-9 w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {filterOptions.map((option) => (
              <Select
                key={option.value}
                value={filters[option.value] || ""}
                onValueChange={(value) => handleFilterChange(option.value, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={option.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All {option.label}</SelectItem>
                  {option.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="icon"
                onClick={clearFilters}
                className="h-10 w-10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
