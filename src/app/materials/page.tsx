import { IndexedFileList } from "@/components/indexed-file-list";

export const dynamic = "force-dynamic";

export default function MaterialsPage() {
  return (
    <IndexedFileList
      category="material"
      emptyText="No indexed material files found."
      title="Materials"
      subtitle="Reference documents such as tenant overviews, contacts, birthdays, review timelines, and recommendations."
    />
  );
}
