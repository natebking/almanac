import { IndexedFileList } from "@/components/indexed-file-list";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  return (
    <IndexedFileList
      category="project"
      emptyText="No active indexed projects found."
      title="Projects"
      subtitle="Current remodels and active work indexed from Google Drive."
    />
  );
}
