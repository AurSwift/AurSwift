/**
 * Transaction Detail Drawer
 *
 * Sheet/drawer that shows full transaction details (master-detail pattern).
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TransactionDetailsContent } from "./transaction-details";
import type { Transaction } from "./sales-reports-transaction-list";

export interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDrawer({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle>
            {transaction
              ? `Receipt #${transaction.receiptNumber}`
              : "Transaction details"}
          </SheetTitle>
        </SheetHeader>
        {transaction && (
          <div className="mt-4">
            <TransactionDetailsContent transaction={transaction} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
