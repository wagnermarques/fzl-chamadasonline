import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

interface CodeResponse {
  code: string;
  secondsRemaining: number;
}

export function AdminCodeDisplay() {
  const { eventId, periodId } = useParams<{ eventId: string; periodId: string }>();

  const codeQuery = useQuery({
    queryKey: ["period-code", periodId],
    queryFn: () => api<CodeResponse>(`/events/${eventId}/periods/${periodId}/code`),
    refetchInterval: 5_000,
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8">
      <p className="text-2xl text-slate-400">Digite o código no app para confirmar presença</p>
      <p className="text-[12rem] leading-none font-black tracking-widest">
        {codeQuery.data?.code ?? "-----"}
      </p>
      {codeQuery.data && (
        <p className="text-xl text-slate-500">Renova em {codeQuery.data.secondsRemaining}s</p>
      )}
    </div>
  );
}
