import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

interface CheckinItem {
  id: string;
  createdAt: string;
  flagged: boolean;
  student: { name: string; registrationNumber: string | null };
}

export function AdminCheckins() {
  const { eventId, periodId } = useParams<{ eventId: string; periodId: string }>();

  const checkinsQuery = useQuery({
    queryKey: ["period-checkins", periodId],
    queryFn: () =>
      api<{ count: number; checkins: CheckinItem[] }>(
        `/events/${eventId}/periods/${periodId}/checkins`,
      ),
    refetchInterval: 5_000,
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Check-ins ({checkinsQuery.data?.count ?? 0})</h1>
      <ul className="divide-y divide-slate-800">
        {checkinsQuery.data?.checkins.map((c) => (
          <li key={c.id} className="py-2 flex justify-between text-sm">
            <span>
              {c.student.name} {c.student.registrationNumber && `(${c.student.registrationNumber})`}
            </span>
            <span className={c.flagged ? "text-amber-400" : "text-slate-500"}>
              {new Date(c.createdAt).toLocaleTimeString()} {c.flagged && "⚠ sinalizado"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
