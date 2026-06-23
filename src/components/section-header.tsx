export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}
