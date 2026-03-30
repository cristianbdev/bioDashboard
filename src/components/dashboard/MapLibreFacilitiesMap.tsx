"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Map, {
  FullscreenControl,
  NavigationControl,
  ScaleControl,
  Marker,
  Popup,
  MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import Supercluster from "supercluster";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";

type Props = {
  data: DashboardData;
  filteredFacilities: FacilitySummary[];
};

// Capas de mapa disponibles
const MAP_STYLES = {
  cartoDark: {
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    name: "Oscuro",
    icon: "🌙",
  },
  stadiaOutdoors: {
    url: "https://tiles.stadiamaps.com/styles/outdoors.json",
    name: "Terreno",
    icon: "🗻",
  },
};

const RISK_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  HIGH: { bg: "#fee2e2", border: "#dc2626", text: "#991b1b" },
  MEDIUM: { bg: "#ffedd5", border: "#ea580c", text: "#9a3412" }, // Corregido de MODERATE a MEDIUM
  LOW: { bg: "#dcfce7", border: "#16a34a", text: "#166534" },
  NEGLIGIBLE: { bg: "#dbeafe", border: "#2563eb", text: "#1e40af" },
};

const DEFAULT_RISK_COLOR = { bg: "#e2e8f0", border: "#64748b", text: "#475569" };

// Helper para abreviar números grandes
const formatNumber = (n: number): string => {
  if (n >= 1000) return `${Math.floor(n / 1000)}k`;
  return n.toString();
};

export function MapLibreFacilitiesMap({ data, filteredFacilities }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [mapStyle, setMapStyle] = useState(MAP_STYLES.cartoDark.url);
  const [selectedFacility, setSelectedFacility] = useState<FacilitySummary | null>(null);
  const [bounds, setBounds] = useState<[number, number, number, number]>([-180, -85, 180, 85]);
  const [zoom, setZoom] = useState(4);

  // Preparar datos para supercluster
  const points = useMemo(() => {
    return filteredFacilities
      .filter((f) => f.geolocation && f.geolocation[0] && f.geolocation[1])
      .map((f) => ({
        type: "Feature" as const,
        properties: {
          id: f.id,
          facility: f,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [f.geolocation![1], f.geolocation![0]],
        },
      }));
  }, [filteredFacilities]);

  // Crear supercluster index
  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 60,
      maxZoom: 16,
    });
    sc.load(points);
    return sc;
  }, [points]);

  // Obtener clusters para el viewport actual
  const clusters = useMemo(() => {
    return supercluster.getClusters(bounds, zoom);
  }, [supercluster, bounds, zoom]);

  // Centro inicial del mapa
  const center = useMemo(() => {
    if (points.length === 0) return { lat: 4.5, lng: -74 };
    const latitudes = points.map((p) => p.geometry.coordinates[1]);
    const longitudes = points.map((p) => p.geometry.coordinates[0]);
    return {
      lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    };
  }, [points]);

  // Zoom inicial
  const initialZoom = useMemo(() => {
    if (points.length <= 1) return 10;
    if (points.length <= 5) return 6;
    return 4;
  }, [points.length]);

  // Manejar cambio de viewport
  const handleMove = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const b = map.getBounds();
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
  }, []);

  // Manejar zoom
  const handleZoom = useCallback(() => {
    if (!mapRef.current) return;
    setZoom(mapRef.current.getZoom());
  }, []);

  // Expandir cluster
  const expandCluster = (clusterId: number, lng: number, lat: number) => {
    const expansionZoom = supercluster.getClusterExpansionZoom(clusterId);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: expansionZoom, duration: 500 });
  };

  // Manejar click en el mapa para cerrar popup
  const handleMapClick = useCallback(() => {
    setSelectedFacility(null);
  }, []);

  if (points.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm bg-slate-50 rounded-lg">
        No hay facilities con datos de geolocalización
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md bg-slate-50">
      {/* Switcher de capas - Ahora scrollable en mobile y bonito */}
      <div className="absolute top-3 left-3 z-10 flex gap-2 w-[calc(100%-80px)] overflow-x-auto pb-2 pr-4 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pointer-events-auto">
        {Object.entries(MAP_STYLES).map(([key, style]) => (
          <button
            key={key}
            onClick={() => setMapStyle(style.url)}
            className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full shadow-sm border transition-all ${
              mapStyle === style.url
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white/95 backdrop-blur-sm text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="mr-1.5">{style.icon}</span>
            {style.name}
          </button>
        ))}
      </div>

      {/* Contador de facilities en Top Right */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm rounded-full shadow-sm border border-slate-200 px-3 py-1.5 pointer-events-auto">
        <span className="text-xs font-semibold text-slate-700">
          {points.length} <span className="hidden sm:inline">{points.length === 1 ? "facility" : "facilities"}</span>
        </span>
      </div>

      {/* Leyenda de riesgos - Movida a Bottom Left para no pisar los controles de Zoom */}
      <div className="absolute bottom-6 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 p-3 min-w-[130px] pointer-events-auto">
        <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">Riesgo</div>
        <div className="space-y-2">
          {Object.entries(RISK_COLORS).map(([level, colors]) => (
            <div key={level} className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: colors.border }}
              />
              <span className="text-xs font-medium text-slate-700 capitalize">{level.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mapa con clusters calculados localmente */}
      <Map
        ref={mapRef}
        mapStyle={mapStyle}
        initialViewState={{
          latitude: center.lat,
          longitude: center.lng,
          zoom: initialZoom,
        }}
        style={{ width: "100%", height: "100%" }}
        onMove={handleMove}
        onZoom={handleZoom}
        onLoad={handleMove}
        onClick={handleMapClick}
        dragRotate={false}
        touchPitch={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        <FullscreenControl position="bottom-right" />
        <ScaleControl position="bottom-right" />

        {/* Renderizar clusters y puntos individuales */}
        {clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount, cluster_id: clusterId } =
            cluster.properties as any;

          if (isCluster && pointCount) {
            // Es un cluster - mostrar con HTML/CSS personalizado
            const size = Math.min(50, 30 + pointCount * 0.5);
            const isLarge = pointCount >= 25;
            const isMedium = pointCount >= 10 && pointCount < 25;
            
            return (
              <Marker
                key={`cluster-${clusterId}`}
                longitude={lng}
                latitude={lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  expandCluster(clusterId, lng, lat);
                }}
              >
                <div
                  className={`
                    flex items-center justify-center rounded-full cursor-pointer
                    border-3 border-white shadow-lg transition-transform hover:scale-110
                    font-bold text-white text-sm select-none
                    ${isLarge ? "bg-red-500" : isMedium ? "bg-purple-500" : "bg-blue-500"}
                  `}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    fontSize: size > 35 ? "14px" : "12px",
                  }}
                >
                  {formatNumber(pointCount)}
                </div>
              </Marker>
            );
          } else {
            // Es un punto individual
            const facility = (cluster.properties as any).facility as FacilitySummary;
            if (!facility) return null;
            
            const colors = RISK_COLORS[facility.riskLevel] || DEFAULT_RISK_COLOR;

            return (
              <Marker
                key={`point-${facility.id}`}
                longitude={lng}
                latitude={lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedFacility(facility);
                }}
              >
                <div
                  className="w-5 h-5 rounded-full border-3 border-white shadow-md cursor-pointer
                           transition-transform hover:scale-125 hover:shadow-lg"
                  style={{ backgroundColor: colors.border }}
                />
              </Marker>
            );
          }
        })}

        {/* Popup */}
        {selectedFacility?.geolocation && (
          <Popup
            longitude={selectedFacility.geolocation[1]}
            latitude={selectedFacility.geolocation[0]}
            anchor="bottom"
            onClose={() => setSelectedFacility(null)}
            closeButton={false}
            closeOnClick={false}
            offset={[0, -12]}
            className="z-50"
          >
            <FacilityPopup facility={selectedFacility} onClose={() => setSelectedFacility(null)} />
          </Popup>
        )}
      </Map>
    </div>
  );
}

// Popup component
function FacilityPopup({ facility, onClose }: { facility: FacilitySummary; onClose: () => void }) {
  const colors = RISK_COLORS[facility.riskLevel] || DEFAULT_RISK_COLOR;
  const Icon = facility.riskLevel === "HIGH" 
    ? AlertTriangle 
    : facility.riskLevel === "LOW" || facility.riskLevel === "NEGLIGIBLE" 
    ? CheckCircle 
    : Info;

  return (
    <div className="p-0 overflow-hidden min-w-[280px] rounded-lg bg-white shadow-xl border border-slate-100 relative group">
      {/* Botón de cerrar elegante */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-800 transition-all shadow-sm border border-white/20 backdrop-blur-sm"
        title="Cerrar"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      {/* Header con color de riesgo */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-100" style={{ backgroundColor: `${colors.bg}60` }}>
        <div 
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border-2 border-white"
          style={{ backgroundColor: colors.bg, color: colors.border }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0 pr-6">
          <h3 className="font-extrabold text-slate-900 text-base leading-tight break-words">
            {facility.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colors.border }}></span>
            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: colors.border }}>
              Nivel {facility.riskLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Ubicación */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Ubicación</span>
            <p className="text-xs text-slate-700 font-medium leading-snug">
              {facility.location || facility.basedOn || "No especificada"}
            </p>
          </div>
        </div>

        {/* Grid de detalles */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Puntaje</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-slate-900 leading-none">{facility.score}</span>
              <span className="text-[10px] text-slate-400 font-bold">/100</span>
            </div>
          </div>
          
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Especie</span>
            <p className="text-xs font-bold text-slate-700 truncate">{facility.species || "-"}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Sistema</span>
            <p className="text-xs font-bold text-slate-700 truncate">{facility.productionSystem || "-"}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Mercado</span>
            <p className="text-xs font-bold text-slate-700 truncate">{facility.market || "-"}</p>
          </div>
        </div>

        {/* Pie del Tooltip */}
        {facility.lastUpdated && (
          <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[9px] text-slate-400 font-medium">Actualizado:</span>
            <span className="text-[9px] text-slate-500 font-bold">
              {new Date(facility.lastUpdated).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
