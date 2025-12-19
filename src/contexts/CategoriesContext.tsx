import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicAPI } from "../services/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined
);

export const CategoriesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Use React Query to fetch and cache categories
  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: publicAPI.getCategories,
    staleTime: 60 * 60 * 1000, // 1 hour - categories rarely change
    gcTime: 2 * 60 * 60 * 1000, // 2 hours cache time
  });

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        isLoading,
        error: error as Error | null,
        refetch,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
};
