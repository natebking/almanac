import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { getDb } from "@/lib/db";
import { buildIndexedFileGroups } from "@/lib/files/indexed-file-groups";
import { getAlphaUser } from "@/lib/session";

export async function IndexedFileList({
  category,
  emptyText,
  subtitle,
  title,
}: {
  category: string;
  emptyText: string;
  subtitle: string;
  title: string;
}) {
  const db = await getDb();
  const user = await getAlphaUser();
  const files = await db.driveFileIndex.findMany({
    where: { userId: user.id, category },
    include: { propertyIndex: true },
    orderBy: { modifiedTime: "desc" },
  });
  const groups = buildIndexedFileGroups(files);

  return (
    <div className="stack-xl">
      <section className="source-banner">
        <div>
          <p className="muted-label">Google Drive index</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </section>
      {groups.length === 0 ? (
        <section className="content-section">
          <SectionHeader title="Indexed files" />
          <p className="empty-state">{emptyText}</p>
        </section>
      ) : null}
      {groups.map((group) => (
        <section className="content-section" key={group.key}>
          <SectionHeader
            title={group.title}
            action={
              group.propertyHref ? (
                <Link href={group.propertyHref}>Open house</Link>
              ) : null
            }
          />
          <div className="list-panel">
            {group.files.map((file) => (
              <div className="data-row" key={file.id}>
                <div>
                  <strong>{file.name}</strong>
                  <p>{file.subtitle}</p>
                </div>
                <a className="inline-link" href={file.webViewLink} target="_blank">
                  Open
                </a>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
