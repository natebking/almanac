import { IndexedFileList } from "@/components/indexed-file-list";

export const dynamic = "force-dynamic";

export default function FinancialPage() {
  return (
    <IndexedFileList
      category="financial"
      emptyText="No indexed financial files found."
      title="Financial"
      subtitle="Income, expenses, commissions, owner statements, and deposited checks remain in Google Drive."
    />
  );
}
