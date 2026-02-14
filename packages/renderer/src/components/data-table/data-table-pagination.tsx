import { Pagination } from "@/components/ui/pagination";
import { useDataTableContext } from "./data-table-context";
import { PAGE_SIZE_OPTIONS } from "./utils/table-config";

interface DataTablePaginationProps {
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  pageSizeOptions?: readonly number[];
}

/**
 * DataTable Pagination component
 * Renders pagination controls using the existing Pagination component
 */
export function DataTablePagination({
  showPageSizeSelector = true,
  showPageInfo = false,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: DataTablePaginationProps) {
  const { table } = useDataTableContext();

  const currentPage = table.getState().pagination.pageIndex + 1; // Convert to 1-based
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();
  const totalItems = table.getFilteredRowModel().rows.length;

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={pageCount}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageChange={(page) => table.setPageIndex(page - 1)} // Convert back to 0-based
      onPageSizeChange={(size) => {
        table.setPageSize(size);
        table.setPageIndex(0); // Reset to first page
      }}
      showPageSizeSelector={showPageSizeSelector}
      showPageInfo={showPageInfo}
      pageSizeOptions={Array.from(pageSizeOptions)}
    />
  );
}
