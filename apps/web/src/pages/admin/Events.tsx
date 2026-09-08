import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

interface EventItem {
  id: string;
  name: string;
  date: string;
}

interface PeriodItem {
  id: string;
  label: string;
  eventId: string;
}

/** Parses "lat,lng" lines pasted by staff into a polygon; ignores blank lines. */
function parsePolygonText(text: string): { lat: number; lng: number }[] | undefined {
  const points = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [latStr, lngStr] = line.split(",").map((s) => s.trim());
      return { lat: Number(latStr), lng: Number(lngStr) };
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  return points.length >= 3 ? points : undefined;
}

export function AdminEvents() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("150");
  const [polygonText, setPolygonText] = useState("");

  const eventsQuery = useQuery({
    queryKey: ["admin-events"],
    // No list endpoint yet: this page mainly exists to create events/periods
    // for the current event; wire up GET /events if a full listing UI is
    // needed later.
    queryFn: async () => [] as EventItem[],
  });

  const createEvent = useMutation({
    mutationFn: () =>
      api<EventItem>("/events", {
        method: "POST",
        body: JSON.stringify({
          name,
          date: new Date().toISOString(),
          geofenceLat: Number(lat),
          geofenceLng: Number(lng),
          geofenceRadiusMeters: Number(radius),
          geofencePolygon: parsePolygonText(polygonText),
        }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-events"] }),
  });

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Eventos</h1>
        <Link to="/admin/enroll" className="text-sm underline text-slate-400">
          Vincular celular de aluno
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createEvent.mutate();
        }}
        className="space-y-3 bg-slate-800 p-4 rounded-lg"
      >
        <h2 className="font-medium">Novo evento</h2>
        <input
          placeholder="Nome do evento"
          className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            placeholder="Latitude"
            className="rounded bg-slate-900 border border-slate-700 px-3 py-2"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
          />
          <input
            placeholder="Longitude"
            className="rounded bg-slate-900 border border-slate-700 px-3 py-2"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required
          />
          <input
            placeholder="Raio (m)"
            className="rounded bg-slate-900 border border-slate-700 px-3 py-2"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Polígono do terreno (opcional, uma coordenada "lat,lng" por linha — se preenchido, tem
            prioridade sobre o raio acima)
          </label>
          <textarea
            className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 font-mono text-sm"
            rows={4}
            placeholder={"-23.55052,-46.633308\n-23.55048,-46.63290\n-23.55110,-46.63285\n-23.55115,-46.63305"}
            value={polygonText}
            onChange={(e) => setPolygonText(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={createEvent.isPending}
          className="rounded bg-emerald-500 text-slate-900 font-medium px-4 py-2"
        >
          Criar evento
        </button>
        {createEvent.isSuccess && (
          <CreatePeriodInline eventId={createEvent.data.id} />
        )}
      </form>

      {eventsQuery.data?.length === 0 && (
        <p className="text-slate-400 text-sm">
          Use o link do painel exibido no telão e o de check-ins ao criar um período abaixo.
        </p>
      )}
    </div>
  );
}

function CreatePeriodInline({ eventId }: { eventId: string }) {
  const [label, setLabel] = useState("");
  const [durationHours, setDurationHours] = useState("6");
  const [period, setPeriod] = useState<PeriodItem | null>(null);

  const createPeriod = useMutation({
    mutationFn: () => {
      const now = new Date();
      const endsAt = new Date(now.getTime() + Number(durationHours) * 60 * 60 * 1000);
      return api<PeriodItem>(`/events/${eventId}/periods`, {
        method: "POST",
        body: JSON.stringify({
          label,
          startsAt: now.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      });
    },
    onSuccess: setPeriod,
  });

  if (period) {
    return (
      <div className="pt-3 space-y-2 text-sm">
        <p className="text-emerald-400">Período "{period.label}" criado.</p>
        <div className="flex gap-3">
          <Link className="underline" to={`/admin/events/${eventId}/periods/${period.id}/display`}>
            Abrir telão (código)
          </Link>
          <Link className="underline" to={`/admin/events/${eventId}/periods/${period.id}/checkins`}>
            Ver check-ins
          </Link>
          <Link className="underline" to={`/admin/events/${eventId}/flagged`}>
            Revisar sinalizados
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-3 space-y-2 border-t border-slate-700">
      <h3 className="font-medium">Novo período</h3>
      <input
        placeholder="Ex: Manhã - Abertura"
        className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        required
      />
      <div className="flex gap-2 items-center">
        <label className="text-sm">Duração (h)</label>
        <input
          className="w-20 rounded bg-slate-900 border border-slate-700 px-3 py-2"
          value={durationHours}
          onChange={(e) => setDurationHours(e.target.value)}
        />
        <button
          type="button"
          onClick={() => createPeriod.mutate()}
          disabled={createPeriod.isPending || !label}
          className="rounded bg-emerald-500 text-slate-900 font-medium px-4 py-2"
        >
          Criar período
        </button>
      </div>
    </div>
  );
}
