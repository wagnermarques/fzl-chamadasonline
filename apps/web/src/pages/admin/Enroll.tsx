import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "../../lib/api";

interface LookupResponse {
  student: { id: string; name: string; registrationNumber: string | null };
  verifiedDevice: { verifiedAt: string } | null;
}

interface CodeResponse {
  code: string;
  expiresAt: string;
}

export function AdminEnroll() {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [lookup, setLookup] = useState<LookupResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [code, setCode] = useState<CodeResponse | null>(null);

  const lookupMutation = useMutation({
    mutationFn: () =>
      api<LookupResponse>(`/students/lookup?registrationNumber=${encodeURIComponent(registrationNumber)}`),
    onSuccess: (data) => {
      setLookup(data);
      setLookupError(null);
      setCode(null);
    },
    onError: (err: unknown) => {
      setLookup(null);
      setLookupError(
        err instanceof ApiError && err.status === 404
          ? "Aluno não encontrado. Confira a matrícula."
          : "Não foi possível buscar o aluno.",
      );
    },
  });

  const codeMutation = useMutation({
    mutationFn: () => {
      if (!lookup) throw new Error("no student looked up");
      return api<CodeResponse>(`/students/${lookup.student.id}/enrollment-code`, { method: "POST" });
    },
    onSuccess: setCode,
  });

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold">Vincular celular do aluno</h1>
      <p className="text-sm text-slate-400">
        Com o aluno presente e com o celular dele em mãos: busque a matrícula, gere o código abaixo e
        peça para o aluno abrir "Vincular este celular" no app e digitar o código.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookupMutation.mutate();
        }}
        className="flex gap-2"
      >
        <input
          placeholder="Matrícula (RM)"
          className="flex-1 rounded bg-slate-800 border border-slate-700 px-3 py-2"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={lookupMutation.isPending}
          className="rounded bg-emerald-500 text-slate-900 font-medium px-4 py-2"
        >
          Buscar
        </button>
      </form>

      {lookupError && <p className="text-red-400 text-sm">{lookupError}</p>}

      {lookup && (
        <div className="bg-slate-800 rounded-lg p-4 space-y-3">
          <p className="font-medium">
            {lookup.student.name} ({lookup.student.registrationNumber})
          </p>
          <p className="text-sm text-slate-400">
            {lookup.verifiedDevice
              ? `Celular já vinculado em ${new Date(lookup.verifiedDevice.verifiedAt).toLocaleString()}. Gerar um novo código substitui o vínculo atual.`
              : "Nenhum celular vinculado ainda."}
          </p>

          <button
            onClick={() => codeMutation.mutate()}
            disabled={codeMutation.isPending}
            className="w-full rounded bg-emerald-500 text-slate-900 font-medium px-4 py-2"
          >
            Gerar código de vínculo
          </button>

          {code && (
            <div className="text-center pt-2">
              <p className="text-5xl font-black tracking-widest">{code.code}</p>
              <p className="text-sm text-slate-400 mt-2">
                Válido até {new Date(code.expiresAt).toLocaleTimeString()}. Peça para o aluno digitar
                este código em "Vincular este celular" no app dele.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
