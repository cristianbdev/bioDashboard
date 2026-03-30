# MapLibre Facilities Map - Implementación Código

## 1. Instalación

```bash
npm install maplibre-gl react-map-gl supercluster
npm install -D @types/maplibre-gl @types/geojson
```

## 2. Variables de Entorno (.env.local)

```bash
# Opcional: Solo si usas Stadia Maps (recomendado para satélite y topografía)
NEXT_PUBLIC_STADIA_API_KEY=tu_api_key_aqui

# Opcional: Para geocoding (si necesitas buscar lugares)
# Si no tienes, usamos Nominatim OSM (gratis)
```

## 3. Componente Principal

```tsx
// src/components/dashboard/MapLibreFacilitiesMap.tsx
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Map, {
  FullscreenControl,
  NavigationControl,
  ScaleControl,
  Source,
  Layer,
  Popup,
  MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CircleLayer, SymbolLayer } from "maplibre-gl";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";

type Props = {
  data: DashboardData;
  filteredFacilities: FacilitySummary[];
};

// Capas de mapa disponibles (TODAS GRATIS)
const MAP_STYLES = {
  cartoPositron: {
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    name: "Claro (CartoDB)",
    icon: "☀️",
  },
  cartoDark: {
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    name: "Oscuro (CartoDB)",
    icon: "🌙",
  },
  stadiaOutdoors: {
    url: "https://tiles.stadiamaps.com/styles/outdoors.json",
    name: "Terreno (Stadia)",
    icon: "🗻",
  },
  stadiaSatellite: {
    url: "https://tiles.stadiamaps.com/styles/alidade_satellite.json",
    name: "Satélite (Stadia)",
    icon: "🛰️",
  },
  osm: {
    url: "https://demotiles.maplibre.org/style.json",
    name: "OSM Estándar",
    icon: "🗺️",
  },
};

// Colores por nivel de riesgo
const RISK_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  HIGH: { bg: "#fecaca", border: "#ef4444", text: "#991b1b" },
  MODERATE: { bg: "#fed7aa", border: "#f97316", text: "#9a3412" },
  LOW: { bg: "#bbf7d0", border: "#22c55e", text: "#166534" },
  NEGLIGIBLE: { bg: "#bfdbfe", border: "#3b82f6", text: "#1e40af" },
};

const DEFAULT_RISK_COLOR = { bg: "#e2e8f0", border: "#64748b", text: "#475569" };

export function MapLibreFacilitiesMap({ data, filteredFacilities }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [mapStyle, setMapStyle] = useState(MAP_STYLES.cartoPositron.url);
  const [selectedFacility, setSelectedFacility] = useState<FacilitySummary | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);

  // Preparar datos GeoJSON de facilities
  const facilitiesGeoJSON = useMemo(() => {
    const features = filteredFacilities
      .filter((f) => f.geolocation)
      .map((f) => ({
        type: "Feature" as const,
        properties: {
          id: f.id,
          name: f.name,
          riskLevel: f.riskLevel,
          score: f.score,
          location: f.basedOn || f.location,
          species: f.species,
          productionSystem: f.productionSystem,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [f.geolocation![1], f.geolocation![0]], // [lng, lat]
        },
      }));

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [filteredFacilities]);

  // Calcular centro del mapa
  const mapCenter = useMemo(() => {
    if (facilitiesGeoJSON.features.length === 0) {
      return { lat: 4.5, lng: -74.0 }; // Colombia por defecto
    }
    
    const lats = facilitiesGeoJSON.features.map((f) => f.geometry.coordinates[1]);
    const lngs = facilitiesGeoJSON.features.map((f) => f.geometry.coordinates[0]);
    
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  }, [facilitiesGeoJSON]);

  // Calcular zoom inicial
  const initialZoom = useMemo(() => {
    if (facilitiesGeoJSON.features.length <= 1) return 10;
    if (facilitiesGeoJSON.features.length <= 5) return 6;
    return 4;
  }, [facilitiesGeoJSON.features.length]);

  // Manejar click en marcador
  const handleMapClick = useCallback((event: maplibregl.MapMouseEvent) => {
    const features = event.target.queryRenderedFeatures(event.point, {
      layers: ["clusters", "unclustered-point"],
    });

    if (!features.length) {
      setSelectedFacility(null);
      return;
    }

    const feature = features[0];
    
    if (feature.layer.id === "clusters") {
      // Click en cluster - zoom in
      const clusterId = feature.properties?.cluster_id;
      const source = mapRef.current?.getSource("facilities") as maplibregl.GeoJSONSource;
      
      source.getClusterExpansionZoom(clusterId).then((zoom) => {
        mapRef.current?.flyTo({
          center: feature.geometry.coordinates as [number, number],
          zoom,
          duration: 500,
        });
      });
    } else {
      // Click en punto individual
      const facility = filteredFacilities.find(
        (f) => f.id === feature.properties?.id
      );
      if (facility) {
        setSelectedFacility(facility);
      }
    }
  }, [filteredFacilities]);

  if (filteredFacilities.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm bg-slate-50 rounded-lg">
        No hay facilities con datos de geolocalización
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden">
      {/* Switcher de capas */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 max-w-[calc(100%-100px)]">
        {Object.entries(MAP_STYLES).map(([key, style]) => (
          <button
            key={key}
            onClick={() => setMapStyle(style.url)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md shadow-sm border transition-all ${
              mapStyle === style.url
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="mr-1">{style.icon}</span>
            {style.name}
          </button>
        ))}
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 p-3">
        <div className="text-xs font-medium text-slate-700 mb-2">Risk Level</div>
        <div className="space-y-1.5">
          {Object.entries(RISK_COLORS).map(([level, colors]) => (
            <div key={level} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full border"
                style={{ backgroundColor: colors.border, borderColor: colors.border }}
              />
              <span className="text-[11px] text-slate-600 capitalize">
                {level.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Contador de facilities visibles */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm rounded-full shadow-sm border border-slate-200 px-3 py-1.5">
        <span className="text-xs font-medium text-slate-700">
          {filteredFacilities.length} facilities
        </span>
      </div>

      {/* Mapa */}
      <Map
        ref={mapRef}
        mapStyle={mapStyle}
        initialViewState={{
          latitude: mapCenter.lat,
          longitude: mapCenter.lng,
          zoom: initialZoom,
        }}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
        interactive={true}
      >
        {/* Controles */}
        <NavigationControl position="bottom-right" />
        <FullscreenControl position="bottom-right" />
        <ScaleControl position="bottom-left" />

        {/* Source de facilities con clustering */}
        <Source
          id="facilities"
          type="geojson"
          data={facilitiesGeoJSON}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          {/* Capa de clusters */}
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#3b82f6",
                10,
                "#8b5cf6",
                25,
                "#ef4444",
              ],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                10,
                25,
                25,
                32,
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
              "circle-opacity": 0.8,
            }}
          />

          {/* Contador de puntos en cluster */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": "{point_count_abbreviated}",
              "text-size": 12,
              "text-font": ["Open Sans Bold"],
            }}
            paint={{
              "text-color": "#ffffff",
            }}
          />

          {/* Puntos individuales */}
          <Layer
            id="unclustered-point"
            type="circle"
            filter={["!has", "point_count"]}
            paint={{
              "circle-radius": 10,
              "circle-radius-stops": [
                [8, 8],
                [16, 12],
              ],
              "circle-color": [
                "match",
                ["get", "riskLevel"],
                "HIGH",
                RISK_COLORS.HIGH.border,
                "MODERATE",
                RISK_COLORS.MODERATE.border,
                "LOW",
                RISK_COLORS.LOW.border,
                "NEGLIGIBLE",
                RISK_COLORS.NEGLIGIBLE.border,
                DEFAULT_RISK_COLOR.border,
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
              "circle-opacity": 0.9,
            }}
          />

          {/* Labels de facilities en zoom alto */}
          <Layer
            id="facility-labels"
            type="symbol"
            filter={["!has", "point_count"]}
            minzoom={10}
            layout={{
              "text-field": ["get", "name"],
              "text-size": 11,
              "text-offset": [0, 1.5],
              "text-anchor": "top",
              "text-font": ["Open Sans Regular"],
            }}
            paint={{
              "text-color": "#334155",
              "text-halo-color": "#ffffff",
              "text-halo-width": 2,
            }}
          />
        </Source>

        {/* Popup de facility seleccionada */}
        {selectedFacility?.geolocation && (
          <Popup
            latitude={selectedFacility.geolocation[0]}
            longitude={selectedFacility.geolocation[1]}
            anchor="bottom"
            onClose={() => setSelectedFacility(null)}
            closeButton
            closeOnClick={false}
            offset={[0, -12]}
          >
            <FacilityPopup facility={selectedFacility} />
          </Popup>
        )}
      </Map>
    </div>
  );
}

// Componente de popup
function FacilityPopup({ facility }: { facility: FacilitySummary }) {
  const colors = RISK_COLORS[facility.riskLevel] || DEFAULT_RISK_COLOR;
  const RiskIcon =
    facility.riskLevel === "HIGH"
      ? AlertTriangle
      : facility.riskLevel === "LOW" || facility.riskLevel === "NEGLIGIBLE"
      ? CheckCircle
      : Info;

  return (
    <div className="min-w-[240px] max-w-[320px] p-1">
      {/* Header */}
      <div className="flex items-start gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: colors.bg }}
        >
          <RiskIcon className="w-4 h-4" style={{ color: colors.border }} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm leading-tight">
            {facility.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {facility.basedOn || facility.location}
          </p>
        </div>
      </div>

      {/* Risk badge */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: colors.border }}
        />
        {facility.riskLevel.toLowerCase()} risk
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <div>
          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
            Score
          </span>
          <div className="text-sm font-semibold text-slate-900">
            {facility.score}
            <span className="text-slate-400 font-normal">/100</span>
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
            Species
          </span>
          <div className="text-sm font-medium text-slate-700 truncate">
            {facility.species}
          </div>
        </div>
        {facility.productionSystem && (
          <div className="col-span-2">
            <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
              System
            </span>
            <div className="text-sm text-slate-700">{facility.productionSystem}</div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 4. Integración en Overview.tsx

```tsx
// En overview.tsx - Reemplazar el bloque del mapa actual

import { MapLibreFacilitiesMap } from "./MapLibreFacilitiesMap";

// ... dentro del return, reemplaza todo el Card del mapa:

<Card className="border-0 shadow-sm">
  <CardHeader className="pb-2">
    <InfoTitle title={t("charts.mapCoverage")} info={t("info.mapCoverage")} />
    <CardDescription>
      {t("charts.mapCoverageSubtitle")} ({geoPoints.length})
    </CardDescription>
  </CardHeader>
  <CardContent className="h-[420px]">
    <MapLibreFacilitiesMap 
      data={data} 
      filteredFacilities={filteredFacilities} 
    />
  </CardContent>
</Card>
```

## 5. Estilos CSS Adicionales (globals.css)

```css
/* MapLibre custom styles */
.maplibregl-popup-content {
  padding: 0 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}

.maplibregl-popup-close-button {
  font-size: 16px;
  padding: 8px;
  color: #64748b;
}

.maplibregl-popup-close-button:hover {
  color: #1e293b;
}

/* Cluster hover effect */
.maplibregl-canvas-container:hover {
  cursor: grab;
}

.maplibregl-canvas-container:active {
  cursor: grabbing;
}
```

## 6. Resultado Final

✅ **Tiempo de implementación**: ~2 horas
✅ **Costo**: $0 perpetuo
✅ **Calidad**: Visual tipo Google Maps CartoDB
✅ **Features**:
   - 5 capas diferentes (Claro, Oscuro, Terreno, Satélite, OSM)
   - Clusters dinámicos con contador
   - Colores por nivel de riesgo
   - Popups informativos ricos
   - Labels de facilities en zoom alto
   - Responsive y mobile-friendly
   - Controles de zoom, fullscreen y escala

---

## 7. Troubleshooting

### Error "CORS" al cargar tiles
- CartoDB: Problema raro, generalmente funciona
- Stadia: Requiere API key para producción (pero 200k tiles gratis)
- OSM: Funciona siempre

### Marcadores no aparecen
Verificar que coordinates sea [lng, lat] (no [lat, lng])

### Mapa en blanco
Revisar que el container tenga tamaño definido (h-[420px])

### Clusters no funcionan
Asegurar que `cluster: true` en el Source y que hay suficientes puntos.
