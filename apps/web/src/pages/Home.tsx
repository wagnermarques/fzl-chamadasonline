import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { getCurrentPosition } from "../lib/geolocation";
import { computeFingerprintHash, getOrCreateClientToken } from "../lib/device";

interface ActiveEventResponse {
  active: boolean;
  event?: { id: string; name: string };
  period?: { id: string; label: string };
}

export function Home() {
  const { user, logout } = useAuth();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeQuery = useQuery({
    queryKey: ["active-event"],
    queryFn: () => api<ActiveEventResponse>("/events/active"),
    refetchInterval: 30_000,
  });

  const checkinMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const [position, fingerprintHash] = await Promise.all([
        getCurrentPosition(),
        computeFingerprintHash(),
      ]);
      const clientToken = getOrCreateClientToken();
      return api("/checkins", {
        method: "POST",
        body: JSON.stringify({
          eventPeriodId: periodId,
          code,
          lat: position.lat,
          lng: position.lng,
          clientToken,
          fingerprintHash,
        }),
      });
    },
    onSuccess: () => setStatus("success"),
    onError: (err: unknown) => {
      setStatus("error");
      const message =
        err && typeof err === "object" && "body" in err
          ? (err.body as { error?: string })?.error
          : undefined;
      setErrorMessage(
        message === "invalid_or_expired_code"
          ? "Código inválido ou expirado. Confira o telão e tente novamente."
          : "Não foi possível registrar a presença. Verifique sua localização e conexão.",
      );
    },
  });

  const period = activeQuery.data?.active ? activeQuery.data.period : undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6">
      <div className="w-full max-w-sm space-y-1 text-center">
        <p className="text-sm text-slate-400">Olá, {user?.name}</p>
        <button onClick={logout} className="text-xs text-slate-500 underline">
          Sair
        </button>
      </div>

      {!activeQuery.data?.active && (
        <p className="text-slate-400 text-center max-w-sm">
          Nenhum evento ativo no momento. Volte quando o evento começar.
        </p>
      )}

      {period && (
        <div className="w-full max-w-sm space-y-4">
          <p className="text-center text-lg">{period.label}</p>

          <div>
            <label className="block text-sm mb-1" htmlFor="code">
              Código exibido no telão
            </label>
            <input
              id="code"
              className="w-full text-center tracking-[0.3em] uppercase rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xl"
              value={code}
              maxLength={5}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>

          <button
            onClick={() => {
              setStatus("idle");
              checkinMutation.mutate(period.id);
            }}
            disabled={checkinMutation.isPending || code.length < 5}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-6 text-2xl font-bold text-slate-900"
          >
            {checkinMutation.isPending ? "Registrando..." : "Marcar Presença"}
          </button>

          {status === "success" && (
            <p className="text-emerald-400 text-center">Presença registrada!</p>
          )}
          {status === "error" && errorMessage && (
            <p className="text-red-400 text-center">{errorMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
