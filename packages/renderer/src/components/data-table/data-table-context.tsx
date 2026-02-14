import { createContext, useContext } from "react";
import type { Table } from "@tanstack/react-table";

interface DataTableContextValue<TData = any> {
  table: Table<TData>;
}

const DataTableContext = createContext<DataTableContextValue | null>(null);

export function DataTableProvider<TData>({
  table,
  children,
}: {
  table: Table<TData>;
  children: React.ReactNode;
}) {
  return (
    <DataTableContext.Provider value={{ table }}>
      {children}
    </DataTableContext.Provider>
  );
}

export function useDataTableContext<TData = any>(): DataTableContextValue<TData> {
  const context = useContext(DataTableContext);
  
  if (!context) {
    throw new Error(
      "useDataTableContext must be used within a DataTableProvider",
    );
  }
  
  return context as DataTableContextValue<TData>;
}
