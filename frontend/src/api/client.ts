import axios from 'axios';
import {
  Parcel, Building, Floor, VerticalParcel, PropertyRecord,
  UndergroundAsset, GnssStation, ValidationResult, TerrainData,
  LidarPoint, DashboardMetrics
} from '../types';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export const CadastralApi = {
  getParcels: () => apiClient.get<Parcel[]>('/parcels').then(r => r.data),
  getParcelById: (id: string) => apiClient.get<Parcel>(`/parcels/${id}`).then(r => r.data),

  getBuildings: () => apiClient.get<Building[]>('/buildings').then(r => r.data),
  getBuildingById: (id: string) => apiClient.get<Building>(`/buildings/${id}`).then(r => r.data),

  getFloors: (buildingId?: string) =>
    apiClient.get<Floor[]>('/floors', { params: { building_id: buildingId } }).then(r => r.data),

  getVerticalProperties: (buildingId?: string, floorId?: string) =>
    apiClient.get<VerticalParcel[]>('/vertical-properties', { params: { building_id: buildingId, floor_id: floorId } }).then(r => r.data),

  getProperties: () => apiClient.get<PropertyRecord[]>('/properties').then(r => r.data),
  searchUlpin: (ulpin: string) => apiClient.get<any>(`/ulpin/${ulpin}`).then(r => r.data),

  generateUlpin: (payload: { building_id: string; floor_id: string; property_id: string; owner_name?: string; property_type?: string }) =>
    apiClient.post<{ ulpin: string; property_id: string; message: string; created: boolean }>('/ulpin/generate', payload).then(r => r.data),

  getValidationResults: () => apiClient.get<ValidationResult[]>('/validation').then(r => r.data),
  runValidation: () => apiClient.post<ValidationResult[]>('/validation/run').then(r => r.data),

  getUndergroundAssets: () => apiClient.get<UndergroundAsset[]>('/underground-assets').then(r => r.data),
  getGnssStations: () => apiClient.get<GnssStation[]>('/gnss').then(r => r.data),

  getTerrain: () => apiClient.get<TerrainData>('/terrain').then(r => r.data),
  getLidarPoints: () => apiClient.get<LidarPoint[]>('/lidar').then(r => r.data),
  estimateHeightFromLidar: (cx: number, cz: number, radius: number = 25) =>
    apiClient.post<any>('/lidar/estimate-height', { center_x: cx, center_z: cz, radius }).then(r => r.data),

  getDashboardMetrics: () => apiClient.get<DashboardMetrics>('/dashboard').then(r => r.data),

  importGeoJson: (formData: FormData) =>
    apiClient.post<any>('/import/geojson', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  importBuildingHeights: (formData: FormData) =>
    apiClient.post<any>('/import/building-heights', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  importDemCsv: (formData: FormData) =>
    apiClient.post<any>('/import/dem', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
};
