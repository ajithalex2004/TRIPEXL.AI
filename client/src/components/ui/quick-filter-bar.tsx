import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { Badge } from "./badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "./select";
import * as animationUtils from "@/lib/animation-utils";

export interface FilterOption {
  id: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
}

interface QuickFilterBarProps {
  searchPlaceholder?: string;
  filterOptions: FilterOption[];
  onSearch: (query: string) => void;
  onFilterChange: (filterId: string, value: string) => void;
  clearFilters: () => void;
  searchValue: string;
  filterValues: Record<string, string>;
  isFiltering: boolean;
}

export function QuickFilterBar({
  searchPlaceholder = "Search...",
  filterOptions,
  onSearch,
  onFilterChange,
  clearFilters,
  searchValue,
  filterValues,
  isFiltering
}: QuickFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleClearSearch = useCallback(() => {
    onSearch("");
  }, [onSearch]);

  const handleClearFilter = useCallback((filterId: string) => {
    onFilterChange(filterId, "all");
  }, [onFilterChange]);

  const isOptionFiltered = useCallback((filterId: string) => {
    return filterValues[filterId] && filterValues[filterId] !== "all";
  }, [filterValues]);

  return (
    <div className="space-y-4">
      <motion.div 
        variants={animationUtils.fadeIn("up", 0.15)}
        className="flex flex-col md:flex-row gap-3 items-start md:items-center"
      >
        {/* Search box */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-8"
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
          />
          {searchValue && (
            <button
              className="absolute right-2 top-2.5 p-0.5 rounded-full bg-muted/50 hover:bg-muted"
              onClick={handleClearSearch}
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {/* Filter button */}
        <Button
          variant={showFilters ? "secondary" : "outline"}
          className="flex items-center gap-1"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </Button>
        
        {/* Clear filters button (only shows when filters are active) */}
        {isFiltering && (
          <Button
            variant="ghost"
            className="text-primary"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        )}
      </motion.div>
      
      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3">
              {filterOptions.map((option) => (
                <div key={option.id} className="space-y-2">
                  <label className="text-sm font-medium">{option.label}</label>
                  <Select
                    value={filterValues[option.id] || "all"}
                    onValueChange={(value) => onFilterChange(option.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`All ${option.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{`All ${option.label.toLowerCase()}`}</SelectItem>
                      {option.options.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Active filter badges */}
      {isFiltering && (
        <motion.div 
          variants={animationUtils.fadeIn("up", 0.2)}
          className="flex flex-wrap gap-2 pt-2"
        >
          {searchValue && (
            <Badge variant="outline" className="flex gap-1 items-center">
              <span>Search: {searchValue}</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={handleClearSearch}
              />
            </Badge>
          )}
          
          {filterOptions.map((option) => (
            isOptionFiltered(option.id) && (
              <Badge key={option.id} variant="outline" className="flex gap-1 items-center">
                <span>{option.label}: {
                  option.options.find(item => item.value === filterValues[option.id])?.label ||
                  filterValues[option.id]
                }</span>
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleClearFilter(option.id)}
                />
              </Badge>
            )
          ))}
        </motion.div>
      )}
    </div>
  );
}