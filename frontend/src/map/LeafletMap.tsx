import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useCadastralStore } from '../state/useCadastralStore';
import { ORIGIN_LAT, ORIGIN_LNG } from '../utils/coordinates';

// Map updater to pan/zoom when selection changes
const MapController: React.FC = () => {
  const { selectedParcelId, parcels, buildings, selectedBuildingId } = useCadastralStore();
  const map = useMap();

  useEffect(() => {
    if (selectedBuildingId) {
      const bldg = buildings.find(b => b.building_id === selectedBuildingId);
      if (bldg && bldg.geometry.coordinates[0]) {
        const ring = bldg.geometry.coordinates[0];
        const lat = ring[0][1];
        const lng = ring[0][0];
        map.flyTo([lat, lng], 17.5, { duration: 1.2 });
        return;
      }
    }

    if (selectedParcelId) {
      const parcel = parcels.find(p => p.parcel_id === selectedParcelId);
      if (parcel && parcel.geometry.coordinates[0]) {
        const ring = parcel.geometry.coordinates[0];
        const lat = ring[0][1];
        const lng = ring[0][0];
        map.flyTo([lat, lng], 17.5, { duration: 1.2 });
      }
    }
  }, [selectedParcelId, selectedBuildingId, parcels, buildings, map]);

  return null;
};

export const LeafletMap: React.FC = () => {
  const {
    parcels,
    buildings,
    undergroundAssets,
    gnssStations,
    layers,
    selectedParcelId,
    selectedBuildingId,
    selectParcel,
    selectBuilding,
    selectProperty,
    mapTheme
  } = useCadastralStore();

  const isLight = mapTheme === 'light';

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[ORIGIN_LAT, ORIGIN_LNG]}
        zoom={17}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapController />

        {/* Global OpenStreetMap (Clean Google style or Dark GIS theme) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className={isLight ? '' : 'dark-tiles'}
          maxZoom={19}
          maxNativeZoom={18}
        />

        {/* 1. Cadastral Parcels Layer */}
        {layers.parcels &&
          parcels.map((p) => {
            const coords: [number, number][] = p.geometry.coordinates[0].map(
              ([lng, lat]) => [lat, lng]
            );
            const isSelected = selectedParcelId === p.parcel_id;

            return (
              <Polygon
                key={p.parcel_id}
                positions={coords}
                pathOptions={{
                  color: isSelected ? (isLight ? '#1a73e8' : '#00f0ff') : (isLight ? '#3b82f6' : '#0284c7'),
                  weight: isSelected ? 3 : 1.5,
                  fillColor: isSelected ? (isLight ? '#60a5fa' : '#0ea5e9') : (isLight ? '#bfdbfe' : '#0f172a'),
                  fillOpacity: isSelected ? 0.4 : (isLight ? 0.2 : 0.2),
                  dashArray: '5, 4',
                }}
                eventHandlers={{
                  click: () => selectParcel(p.parcel_id),
                }}
              >
                <Tooltip direction="center" permanent={false}>
                  <div className="text-xs font-sans font-medium">
                    <div className="font-bold text-blue-600">{p.parcel_id}</div>
                    <div>{p.survey_number}</div>
                    <div>{p.land_use} ({p.area} m²)</div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

        {/* 2. Building Footprints Layer */}
        {layers.buildings &&
          buildings.map((b) => {
            const coords: [number, number][] = b.geometry.coordinates[0].map(
              ([lng, lat]) => [lat, lng]
            );
            const isSelected = selectedBuildingId === b.building_id;

            return (
              <Polygon
                key={b.building_id}
                positions={coords}
                pathOptions={{
                  color: isSelected ? (isLight ? '#1d4ed8' : '#38bdf8') : (isLight ? '#475569' : '#64748b'),
                  weight: isSelected ? 3 : 2,
                  fillColor: isSelected ? (isLight ? '#2563eb' : '#0284c7') : (isLight ? '#64748b' : '#334155'),
                  fillOpacity: isSelected ? 0.85 : (isLight ? 0.6 : 0.6),
                }}
                eventHandlers={{
                  click: () => selectBuilding(b.building_id),
                }}
              >
                <Tooltip direction="center">
                  <div className="text-xs font-sans">
                    <span className="font-bold text-slate-900 dark:text-white">{b.building_id}</span>
                    <div>{b.height}m ({b.floor_count} Floors)</div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

        {/* 3. Underground Assets (Basements and Pipelines) */}
        {layers.underground &&
          undergroundAssets.map((u) => {
            if (u.geometry.type === 'LineString') {
              const coords: [number, number][] = u.geometry.coordinates.map(
                ([lng, lat]: [number, number]) => [lat, lng]
              );
              return (
                <Polyline
                  key={u.asset_id}
                  positions={coords}
                  pathOptions={{
                    color: '#00f0ff',
                    weight: 4,
                    dashArray: '8, 6',
                    opacity: 0.9,
                  }}
                  eventHandlers={{
                    click: () =>
                      selectProperty({
                        type: 'Underground Asset',
                        id: u.asset_id,
                        asset_type: u.asset_type,
                        z_range: `${u.z_min}m - ${u.z_max}m`,
                        owner: u.owner,
                      }),
                  }}
                >
                  <Tooltip>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {u.asset_type} (Z: {u.z_min}m to {u.z_max}m)
                    </span>
                  </Tooltip>
                </Polyline>
              );
            }
            return null;
          })}

        {/* 4. Elevated Flyover Path */}
        {layers.elevated &&
          undergroundAssets
            .filter((u) => u.asset_id.includes('ELEV') || u.asset_type.includes('Flyover'))
            .map((e) => {
              const coords: [number, number][] = e.geometry.coordinates.map(
                ([lng, lat]: [number, number]) => [lat, lng]
              );
              return (
                <Polyline
                  key={e.asset_id}
                  positions={coords}
                  pathOptions={{
                    color: '#ec4899',
                    weight: 6,
                    opacity: 0.85,
                  }}
                >
                  <Tooltip>
                    <span className="text-xs font-mono font-bold text-pink-400">
                      Elevated Flyover (Z: {e.z_min}m to {e.z_max}m)
                    </span>
                  </Tooltip>
                </Polyline>
              );
            })}

        {/* 5. GNSS CORS Stations */}
        {layers.gnss &&
          gnssStations.map((g) => (
            <CircleMarker
              key={g.station_id}
              center={[g.latitude, g.longitude]}
              radius={8}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#fbbf24',
                fillOpacity: 0.9,
                weight: 2,
              }}
              eventHandlers={{
                click: () =>
                  selectProperty({
                    type: 'GNSS Reference Station',
                    id: g.station_id,
                    elevation: `${g.elevation}m`,
                    accuracy: `±${g.accuracy}m`,
                  }),
              }}
            >
              <Tooltip direction="top">
                <div className="text-xs font-mono font-bold text-amber-300">
                  {g.station_id} (Elev: {g.elevation}m, Acc: ±{g.accuracy}m)
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
};
