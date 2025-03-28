/**
 * Helper function to apply filters to a dataset
 * @param data The data array to filter
 * @param searchQuery The search query string
 * @param filters Object containing filter field names and their selected values
 * @param searchFields Array of object fields to search within
 * @returns Filtered data array
 */
export function applyFilters<T>(
  data: T[], 
  searchQuery: string, 
  filters: Record<string, string>,
  searchFields: (keyof T)[]
): T[] {
  if (!data || !data.length) return [];

  return data.filter((item) => {
    // Search functionality
    let searchMatches = true;
    if (searchQuery) {
      searchMatches = searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Filter functionality
    let filterMatches = true;
    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== "all") {
        const itemValue = item[key as keyof T];
        // Handle numeric comparison if needed
        if (typeof itemValue === "number" && !isNaN(Number(value))) {
          filterMatches = filterMatches && itemValue === Number(value);
        } else {
          filterMatches = filterMatches && String(itemValue) === value;
        }
      }
    }

    return searchMatches && filterMatches;
  });
}

/**
 * Helper function to check if any filters are active
 * @param searchQuery The search query string
 * @param filters Object containing filter field names and their selected values
 * @returns True if any filters are active
 */
export function hasActiveFilters(
  searchQuery: string, 
  filters: Record<string, string>
): boolean {
  if (searchQuery) return true;
  
  for (const value of Object.values(filters)) {
    if (value && value !== "all") return true;
  }
  
  return false;
}

/**
 * Helper function to clear all filters
 * @param setSearchQuery Function to set search query
 * @param setFilters Function to set filters
 */
export function clearAllFilters(
  setSearchQuery: (value: string) => void,
  setFilters: (filters: Record<string, string>) => void
): void {
  setSearchQuery("");
  
  // Reset all filters to "all"
  const resetFilters: Record<string, string> = {};
  setFilters(resetFilters);
}

/**
 * Helper function to extract unique options from data for filtering
 * @param data The data array to analyze
 * @param field The field to extract options from
 * @returns Array of unique values
 */
export function extractUniqueOptions<T>(
  data: T[],
  field: keyof T
): Array<{ value: string; label: string }> {
  if (!data || !data.length) return [];
  
  const uniqueValues = new Set<string>();
  
  data.forEach(item => {
    const value = item[field];
    if (value !== null && value !== undefined) {
      uniqueValues.add(String(value));
    }
  });
  
  return Array.from(uniqueValues)
    .filter(Boolean)
    .sort()
    .map(value => ({ value, label: value }));
}