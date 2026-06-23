type IndexedFileProperty = {
  id: string;
  address: string;
};

const MAX_SUBTITLE_LENGTH = 126;

export type IndexedFileGroupInput = {
  id: string;
  name: string;
  category: string;
  webViewLink: string;
  textExtract?: string | null;
  propertyIndex?: IndexedFileProperty | null;
};

export type IndexedFileGroupItem = {
  id: string;
  name: string;
  category: string;
  webViewLink: string;
  subtitle: string;
};

export type IndexedFileGroup = {
  key: string;
  title: string;
  propertyHref: string | null;
  files: IndexedFileGroupItem[];
};

export function buildIndexedFileGroups(files: IndexedFileGroupInput[]): IndexedFileGroup[] {
  const groupsByKey = new Map<string, IndexedFileGroup>();

  for (const file of files) {
    const groupKey = file.propertyIndex?.id ?? "general";
    const existingGroup = groupsByKey.get(groupKey);
    const group =
      existingGroup ??
      ({
        key: groupKey,
        title: file.propertyIndex?.address ?? "General",
        propertyHref: file.propertyIndex ? `/houses/${file.propertyIndex.id}` : null,
        files: [],
      } satisfies IndexedFileGroup);

    group.files.push({
      id: file.id,
      name: file.name,
      category: file.category,
      webViewLink: file.webViewLink,
      subtitle: buildFileSubtitle(file),
    });

    groupsByKey.set(groupKey, group);
  }

  return Array.from(groupsByKey.values()).sort((left, right) => {
    if (left.key === "general") return 1;
    if (right.key === "general") return -1;
    return left.title.localeCompare(right.title);
  });
}

function buildFileSubtitle(file: IndexedFileGroupInput) {
  const firstTextLine = file.textExtract
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstTextLine ? truncateSubtitle(firstTextLine) : file.category;
}

function truncateSubtitle(subtitle: string) {
  if (subtitle.length <= MAX_SUBTITLE_LENGTH) {
    return subtitle;
  }

  return `${subtitle.slice(0, MAX_SUBTITLE_LENGTH - 3).trimEnd()}...`;
}
