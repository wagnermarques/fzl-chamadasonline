import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { computeFingerprintHash, getOrCreateClientToken } from "../lib/device";

export function EnrollDevice() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const fingerprintHash = await computeFingerprintHash();
      const clientToken = getOrCreateClientToken();
      return api("/devices/enroll", {
        method: "POST",
        body: JSON.stringify({ code, clientToken, fingerprintHash }),
      });
    },
    onSuccess: () => setStatus("success"),
    onError: (err: unknown) => {
      setStatus("error");
      setErrorMessage(
        err instanceof ApiError && err.body && (err.body as { error?: string }).error === "invalid_or_expired_code"
          ? "Código inválido ou expirado. Peça um novo código na secretaria."
          : "Não foi possível vincular este celular. Tente novamente.",
      );
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-semibold">Vincular este celular</h1>
        <p className="text-sm text-slate-400">
          Vá até a secretaria com este celular. A equipe vai gerar um código — digite-o abaixo para que
          só este aparelho possa marcar sua presença.
        </p>

        <input
          className="w-full text-center tracking-[0.3em] uppercase rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xl"
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CÓDIGO"
        />

        <button
          onClick={() => {
            setStatus("idle");
            enrollMutation.mutate();
          }}
          disabled={enrollMutation.isPending || code.length < 6}
          className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-3 font-medium text-slate-900"
        >
          {enrollMutation.isPending ? "Vinculando..." : "Vincular celular"}
        </button>

        {status === "success" && (
          <p className="text-emerald-400">Celular vinculado! Você já pode marcar presença por aqui.</p>
        )}
        {status === "error" && errorMessage && <p className="text-red-400">{errorMessage}</p>}

        <Link to="/" className="block text-sm text-slate-500 underline">
          Voltar
        </Link>
      </div>
    </div>
  );
}
