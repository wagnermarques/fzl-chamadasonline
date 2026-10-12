import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getCurrentPosition } from "../lib/geolocation";
import { computeFingerprintHash, getOrCreateClientToken } from "../lib/device";
import { UserBadge } from "../components/UserBadge";
import { ShareApp } from "../components/ShareApp";

interface ActiveEventResponse {
  active: boolean;
  event?: { id: string; name: string };
  period?: { id: string; label: string };
}

export function Home() {
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
      if (message === "invalid_or_expired_code") {
        setErrorMessage("Código inválido ou expirado. Confira o telão e tente novamente.");
      } else if (message === "device_not_enrolled") {
        setErrorMessage(
          "Este celular não é o vinculado à sua conta. Procure a equipe ou use o celular vinculado.",
        );
      } else {
        setErrorMessage("Não foi possível registrar a presença. Verifique sua localização e conexão.");
      }
    },
  });

  const period = activeQuery.data?.active ? activeQuery.data.period : undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6">
      <div className="w-full max-w-sm space-y-2 text-center">
        <div className="flex justify-center">
          <UserBadge />
        </div>
        <Link to="/vincular" className="text-xs text-slate-500 underline">
          Vincular este celular
        </Link>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <p className="text-center text-lg">
          {period ? period.label : "Nenhum evento ativo no momento"}
        </p>

        <div>
          <label className="block text-sm mb-1" htmlFor="code">
            Código exibido no telão
          </label>
          <input
            id="code"
            className="w-full text-center tracking-[0.3em] uppercase rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xl disabled:opacity-50"
            value={code}
            maxLength={5}
            disabled={!period}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>

        <button
          onClick={() => {
            if (!period) return;
            setStatus("idle");
            checkinMutation.mutate(period.id);
          }}
          disabled={!period || checkinMutation.isPending || code.length < 5}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-6 text-2xl font-bold text-slate-900"
        >
          {checkinMutation.isPending ? "Registrando..." : "Marcar Presença"}
        </button>

        {!period && (
          <p className="text-slate-400 text-center text-sm">
            Volte quando o evento começar para marcar presença.
          </p>
        )}

        {status === "success" && (
          <p className="text-emerald-400 text-center">Presença registrada!</p>
        )}
        {status === "error" && errorMessage && (
          <p className="text-red-400 text-center">{errorMessage}</p>
        )}
      </div>

      <ShareApp />
    </div>
  );
}
