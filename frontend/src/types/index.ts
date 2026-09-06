export interface Parcel {
  id: number;
  parcel_id: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  area: number;
  land_use: string;
  survey_number: string;
  status: string;
}

export interface Building {
  id: number;
  building_id: string;
  parcel_id: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  ground_elevation: number;
  roof_elevation: number;
  height: number;
  floor_count: number;
  building_type: string;
}

export interface Floor {
  id: number;
  floor_id: string;
  building_id: string;
  floor_number: number;
  z_min: number;
  z_max: number;
  area: number;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export interface VerticalParcel {
  id: number;
  vertical_parcel_id: string;
  parcel_id: string;
  building_id: string;
  floor_id: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  z_min: number;
  z_max: number;
  area: number;
  volume: number;
  property_type: string;
}

export interface PropertyRecord {
  id: number;
  property_id: string;
  ulpin: string;
  vertical_parcel_id: string;
  owner_name: string;
  property_type: string;
  status: string;
  verification_status: string;
}

export interface UndergroundAsset {
  id: number;
  asset_id: string;
  asset_type: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  z_min: number;
  z_max: number;
  owner: string;
  status: string;
}

export interface GnssStation {
  id: number;
  station_id: string;
  latitude: float;
  longitude: float;
  elevation: float;
  accuracy: number;
}

export type float = number;

export interface ValidationResult {
  id: number;
  object_id: string;
  object_type: string;
  validation_type: string;
  severity: 'VALID' | 'WARNING' | 'ERROR';
  message: string;
  status: string;
}

export interface TerrainPoint {
  i: number;
  j: number;
  x: number;
  z: number;
  elevation: number;
}

export interface TerrainData {
  size: number;
  resolution: number;
  points: TerrainPoint[];
}

export interface LidarPoint {
  x: number;
  y: number;
  z: number;
  classification: string;
  class_code: number;
  intensity: number;
}

export interface DashboardMetrics {
  total_parcels: number;
  total_buildings: number;
  total_floors: number;
  total_vertical_properties: number;
  total_ulpins: number;
  underground_assets: number;
  validation_errors: number;
  validation_warnings: number;
}
