import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

interface FlaggedItem {
  id: string;
  createdAt: string;
  flagReasons: string[];
  student: { name: string; registrationNumber: string | null };
  eventPeriod: { label: string };
}

const REASON_LABELS: Record<string, string> = {
  outside_geofence: "Fora da área do evento",
  device_bound_to_other_student: "Dispositivo já usado por outro aluno",
  similar_fingerprint_multiple_students: "Dispositivo semelhante a outro aluno",
};

export function AdminFlagged() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const flaggedQuery = useQuery({
    queryKey: ["flagged", eventId],
    queryFn: () => api<{ flagged: FlaggedItem[] }>(`/events/${eventId}/flagged`),
    refetchInterval: 10_000,
  });

  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      api(`/checkins/${id}/review`, { method: "PATCH", body: JSON.stringify({ decision }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flagged", eventId] }),
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Presenças sinalizadas para revisão</h1>
      {flaggedQuery.data?.flagged.length === 0 && (
        <p className="text-slate-400 text-sm">Nenhuma pendência.</p>
      )}
      <ul className="space-y-3">
        {flaggedQuery.data?.flagged.map((item) => (
          <li key={item.id} className="bg-slate-800 rounded-lg p-4 space-y-2">
            <p className="font-medium">
              {item.student.name} {item.student.registrationNumber && `(${item.student.registrationNumber})`}
            </p>
            <p className="text-sm text-slate-400">{item.eventPeriod.label}</p>
            <ul className="text-sm text-amber-400 list-disc list-inside">
              {item.flagReasons.map((r) => (
                <li key={r}>{REASON_LABELS[r] ?? r}</li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => review.mutate({ id: item.id, decision: "approved" })}
                className="rounded bg-emerald-500 text-slate-900 text-sm font-medium px-3 py-1"
              >
                Aprovar
              </button>
              <button
                onClick={() => review.mutate({ id: item.id, decision: "rejected" })}
                className="rounded bg-red-500 text-slate-900 text-sm font-medium px-3 py-1"
              >
                Rejeitar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
