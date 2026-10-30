import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, ApiError } from "../../lib/api";
import { AdminHeader } from "../../components/AdminHeader";

interface LookupResponse {
  student: { id: string; name: string; registrationNumber: string | null };
  verifiedDevice: { verifiedAt: string } | null;
}

interface CodeResponse {
  code: string;
  expiresAt: string;
}

interface EnrolledDevice {
  deviceId: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  email: string;
  verifiedAt: string;
  lastSeenAt: string | null;
}

interface EnrolledResponse {
  devices: EnrolledDevice[];
  total: number;
}

export function AdminEnroll() {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [lookup, setLookup] = useState<LookupResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [code, setCode] = useState<CodeResponse | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const enrolledQuery = useQuery({
    queryKey: ["enrolled-devices"],
    queryFn: () => api<EnrolledResponse>("/devices/enrolled"),
    refetchInterval: 15_000,
  });

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
    onSuccess: (data) => {
      setCode(data);
      enrolledQuery.refetch();
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (deviceId: string) =>
      api(`/devices/${encodeURIComponent(deviceId)}/unlink`, { method: "POST" }),
    onMutate: (deviceId) => {
      setUnlinkingId(deviceId);
    },
    onSuccess: () => {
      enrolledQuery.refetch();
      if (lookup) {
        lookupMutation.mutate();
      }
    },
    onSettled: () => {
      setUnlinkingId(null);
    },
  });

  const enrolledDevices = enrolledQuery.data?.devices ?? [];

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8">
      <AdminHeader title="Vincular Celular (Secretaria)" />
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
          placeholder="Matrícula (RM) ou E-mail"
          className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={lookupMutation.isPending}
          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold px-5 py-2 transition"
        >
          {lookupMutation.isPending ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {lookupError && <p className="text-red-400 text-sm">{lookupError}</p>}

      {lookup && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4 shadow-lg">
          <div>
            <p className="font-semibold text-lg text-slate-100">
              {lookup.student.name}
            </p>
            <p className="text-xs font-mono text-emerald-400 mt-0.5">
              Matrícula: {lookup.student.registrationNumber || "Sem RM"}
            </p>
          </div>

          <p className="text-sm text-slate-300">
            {lookup.verifiedDevice
              ? `Celular já vinculado em ${new Date(lookup.verifiedDevice.verifiedAt).toLocaleString("pt-BR")}. Gerar um novo código substitui o vínculo atual.`
              : "Nenhum celular vinculado a este aluno ainda."}
          </p>

          <button
            onClick={() => codeMutation.mutate()}
            disabled={codeMutation.isPending}
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-bold py-2.5 transition shadow"
          >
            {codeMutation.isPending ? "Gerando código..." : "Gerar código de vínculo"}
          </button>

          {code && (
            <div className="text-center pt-3 border-t border-slate-700/60 mt-3 space-y-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Código de 6 dígitos gerado
              </span>
              <p className="text-5xl font-black tracking-widest text-emerald-400 font-mono select-all">
                {code.code}
              </p>
              <p className="text-xs text-slate-400">
                Válido até <span className="text-slate-200 font-medium">{new Date(code.expiresAt).toLocaleTimeString("pt-BR")}</span>. Peça para o aluno digitar este código no menu "Vincular este celular".
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lista de Alunos com Celular Vinculado */}
      <div className="pt-4 border-t border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-slate-100">Alunos com Celular Vinculado</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {enrolledDevices.length} {enrolledDevices.length === 1 ? "aluno" : "alunos"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => enrolledQuery.refetch()}
            disabled={enrolledQuery.isFetching}
            className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-800"
            title="Atualizar lista"
          >
            <svg
              className={`w-3.5 h-3.5 ${enrolledQuery.isFetching ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
        </div>

        {enrolledQuery.isLoading && (
          <div className="text-center py-6 text-slate-400 text-sm">
            Carregando lista de dispositivos vinculados...
          </div>
        )}

        {!enrolledQuery.isLoading && enrolledDevices.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400 text-sm">
            Nenhum celular vinculado a nenhum aluno no momento.
          </div>
        )}

        {!enrolledQuery.isLoading && enrolledDevices.length > 0 && (
          <div className="space-y-3">
            {enrolledDevices.map((device) => {
              const isUnlinking = unlinkingId === device.deviceId;
              return (
                <div
                  key={device.deviceId}
                  className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-600 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{device.studentName}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-700 text-emerald-400 border border-slate-600">
                        RM: {device.registrationNumber}
                      </span>
                    </div>
                    {device.email && (
                      <p className="text-xs text-slate-400">{device.email}</p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Vinculado em:{" "}
                      <span className="text-slate-300">
                        {new Date(device.verifiedAt).toLocaleString("pt-BR")}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setRegistrationNumber(device.registrationNumber);
                        lookupMutation.mutate();
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition border border-slate-600"
                    >
                      Ver detalhes
                    </button>
                    <button
                      type="button"
                      disabled={isUnlinking}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Deseja realmente desvincular o celular do aluno ${device.studentName}? Ele voltará a poder marcar presença de qualquer aparelho.`
                          )
                        ) {
                          unlinkMutation.mutate(device.deviceId);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition disabled:opacity-50"
                    >
                      {isUnlinking ? "Desvinculando..." : "Desvincular"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
