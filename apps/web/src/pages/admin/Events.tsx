import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { UserBadge } from "../../components/UserBadge";
import { getCurrentPosition } from "../../lib/geolocation";

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
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  async function fillCurrentLocation() {
    setLoadingLocation(true);
    setLocationStatus("Obtendo coordenadas via GPS...");
    try {
      const coords = await getCurrentPosition();
      setLat(coords.lat.toFixed(6));
      setLng(coords.lng.toFixed(6));
      setLocationStatus("Coordenadas atuais obtidas com sucesso");
    } catch (err) {
      console.warn("Falha ao obter localização:", err);
      setLocationStatus("Não foi possível obter a localização automaticamente.");
    } finally {
      setLoadingLocation(false);
    }
  }

  useEffect(() => {
    fillCurrentLocation();
  }, []);

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
        <UserBadge />
      </div>
      <Link to="/admin/enroll" className="text-sm underline text-slate-400">
        Vincular celular de aluno
      </Link>

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
        
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Área da Geofence</span>
            <button
              type="button"
              onClick={fillCurrentLocation}
              disabled={loadingLocation}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition"
              title="Obter coordenadas atuais do GPS"
            >
              <svg
                className={`w-3.5 h-3.5 ${loadingLocation ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {loadingLocation ? "Obtendo GPS..." : "Capturar GPS atual"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Latitude</label>
              <input
                placeholder="Latitude"
                className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Longitude</label>
              <input
                placeholder="Longitude"
                className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Raio (m)</label>
              <input
                placeholder="Raio (m)"
                className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                required
              />
            </div>
          </div>

          {locationStatus && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  lat && lng ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {locationStatus}
            </p>
          )}
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
