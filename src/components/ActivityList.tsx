interface ActivityRow {
  id: string;
  childName: string;
  childAvatar: string;
  points: number;
  label: string;
  createdAt: number;
}

export default function ActivityList({ entries }: { entries: ActivityRow[] }) {
  if (entries.length === 0) {
    return <p className="text-muted">No activity yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{entry.childAvatar}</span>
            <div>
              <p className="font-medium">{entry.label}</p>
              <p className="text-sm text-muted">
                {entry.childName} · {new Date(entry.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <span className={`font-semibold ${entry.points >= 0 ? "text-success" : "text-danger"}`}>
            {entry.points >= 0 ? "+" : ""}
            {entry.points}
          </span>
        </div>
      ))}
    </div>
  );
}
