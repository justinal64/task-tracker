"use client";

import { useRouter } from "next/navigation";

export default function ActivityFilter({
  kids,
  selected,
}: {
  kids: { id: string; name: string }[];
  selected: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selected}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value === "all" ? "/parent/activity" : `/parent/activity?child=${value}`);
      }}
      className="rounded-lg border border-hairline bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
    >
      <option value="all">All kids</option>
      {kids.map((kid) => (
        <option key={kid.id} value={kid.id}>
          {kid.name}
        </option>
      ))}
    </select>
  );
}
