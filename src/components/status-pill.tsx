const toneClass = {
  success: "pill success",
  warning: "pill warning",
  danger: "pill danger",
  info: "pill info",
  neutral: "pill neutral",
};

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof toneClass;
  children: React.ReactNode;
}) {
  return <span className={toneClass[tone]}>{children}</span>;
}
