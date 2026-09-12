import { create } from 'zustand';
import {
  Parcel, Building, Floor, VerticalParcel, PropertyRecord,
  UndergroundAsset, GnssStation, ValidationResult, TerrainData,
  LidarPoint, DashboardMetrics
} from '../types';
import { CadastralApi } from '../api/client';
import { format14DigitUlpin, generateUnique14DigitUlpin } from '../utils/ulpin';

export type ViewMode = '2d' | '3d' | 'split';
export type CameraPreset = 'default' | 'top' | 'side' | 'isometric';
export type MeasureMode = 'none' | 'distance' | 'height' | 'volume';

interface CadastralState {
  // Data
  parcels: Parcel[];
  buildings: Building[];
  floors: Floor[];
  verticalProperties: VerticalParcel[];
  properties: PropertyRecord[];
  undergroundAssets: UndergroundAsset[];
  gnssStations: GnssStation[];
  terrainData: TerrainData | null;
  lidarPoints: LidarPoint[];
  validationResults: ValidationResult[];
  dashboardMetrics: DashboardMetrics | null;
  isLoading: boolean;
  error: string | null;
  isLiveBackend: boolean;

  // Selections
  viewMode: ViewMode;
  selectedParcelId: string | null;
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedVerticalParcelId: string | null;
  selectedProperty: any | null;
  hoveredId: string | null;

  // Layers
  layers: {
    parcels: boolean;
    buildings: boolean;
    floors: boolean;
    verticalProperties: boolean;
    underground: boolean;
    elevated: boolean;
    gnss: boolean;
    lidar: boolean;
    terrain: boolean;
  };

  // 3D Controls
  isFloorView: boolean;
  isExplodedView: boolean;
  explodeAmount: number;
  zMinClip: number;
  zMaxClip: number;
  isWireframe: boolean;
  isTransparent: boolean;
  cameraPreset: CameraPreset;

  // Measurements
  measureMode: MeasureMode;
  measurePoints: [number, number, number][];

  // UI Panels / Modals & Google Maps UI Controls
  isImportModalOpen: boolean;
  isReportModalOpen: boolean;
  isValidationModalOpen: boolean;
  mapTheme: 'light' | 'dark';
  isLayersOpen: boolean;
  isDetailsOpen: boolean;

  // Actions
  fetchAllData: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setMapTheme: (theme: 'light' | 'dark') => void;
  setLayersOpen: (open: boolean) => void;
  setDetailsOpen: (open: boolean) => void;
  selectParcel: (parcelId: string | null) => void;
  selectBuilding: (buildingId: string | null) => void;
  selectFloor: (floorId: string | null) => void;
  selectVerticalParcel: (vpId: string | null) => void;
  selectProperty: (prop: any | null) => void;
  setHoveredId: (id: string | null) => void;
  toggleLayer: (layerKey: keyof CadastralState['layers']) => void;
  setFloorView: (enabled: boolean) => void;
  setExplodedView: (enabled: boolean) => void;
  setExplodeAmount: (amount: number) => void;
  setZClip: (min: number, max: number) => void;
  setWireframe: (enabled: boolean) => void;
  setTransparent: (enabled: boolean) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setMeasureMode: (mode: MeasureMode) => void;
  addMeasurePoint: (pt: [number, number, number]) => void;
  clearMeasurePoints: () => void;
  setImportModalOpen: (open: boolean) => void;
  setReportModalOpen: (open: boolean) => void;
  setValidationModalOpen: (open: boolean) => void;
  searchGlobal: (query: string) => Promise<boolean>;
  generateUlpinForCurrent: (ownerName?: string, propertyType?: string) => Promise<string | null>;
  runValidationCheck: () => Promise<void>;
  addNewBuilding: (data: {
    building: Building;
    floors: Floor[];
    vertical_parcels: VerticalParcel[];
    property_records: PropertyRecord[];
    validation?: ValidationResult[];
  }) => void;
  removeBuilding: (buildingId: string) => Promise<{ success: boolean; message: string; deleted_ulpins: string[] }>;

  // Interactive Google Earth-style Building Footprint Polygon Measurement
  isMeasuringPolygon: boolean;
  measurePolygonPoints: [number, number][];
  pendingAiBuildingInput: any | null;
  setIsMeasuringPolygon: (active: boolean) => void;
  addMeasurePolygonPoint: (point: [number, number]) => void;
  removeLastMeasurePolygonPoint: () => void;
  clearMeasurePolygon: () => void;
  setPendingAiBuildingInput: (data: any | null) => void;
}

export const useCadastralStore = create<CadastralState>((set, get) => ({
  parcels: [],
  buildings: [],
  floors: [],
  verticalProperties: [],
  properties: [],
  undergroundAssets: [],
  gnssStations: [],
  terrainData: null,
  lidarPoints: [],
  validationResults: [],
  dashboardMetrics: null,
  isLoading: false,
  error: null,
  isLiveBackend: false,

  viewMode: 'split',
  selectedParcelId: 'P001',
  selectedBuildingId: 'B001',
  selectedFloorId: null,
  selectedVerticalParcelId: null,
  selectedProperty: null,
  hoveredId: null,

  layers: {
    parcels: true,
    buildings: true,
    floors: true,
    verticalProperties: true,
    underground: true,
    elevated: true,
    gnss: true,
    lidar: false,
    terrain: true,
  },

  isFloorView: true,
  isExplodedView: false,
  explodeAmount: 2.5,
  zMinClip: 80,
  zMaxClip: 140,
  isWireframe: false,
  isTransparent: false,
  cameraPreset: 'default',

  measureMode: 'none',
  measurePoints: [],

  isImportModalOpen: false,
  isReportModalOpen: false,
  isValidationModalOpen: false,
  mapTheme: 'light',
  isLayersOpen: false,
  isDetailsOpen: true,

  setMapTheme: (theme) => set({ mapTheme: theme }),
  setLayersOpen: (open) => set({ isLayersOpen: open }),
  setDetailsOpen: (open) => set({ isDetailsOpen: open }),

  fetchAllData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [
        parcels, buildings, floors, verticalProperties, properties,
        underground, gnss, terrain, lidar, metrics
      ] = await Promise.all([
        CadastralApi.getParcels(),
        CadastralApi.getBuildings(),
        CadastralApi.getFloors(),
        CadastralApi.getVerticalProperties(),
        CadastralApi.getProperties(),
        CadastralApi.getUndergroundAssets(),
        CadastralApi.getGnssStations(),
        CadastralApi.getTerrain(),
        CadastralApi.getLidarPoints(),
        CadastralApi.getDashboardMetrics(),
      ]);

      const isLive = CadastralApi.getIsLiveBackend();

      // Sanitize and deduplicate buildings: enforce 1 building per parcel to prevent overlapping 3D/2D structures
      const seenParcels = new Set<string>();
      const sanitizedBuildings: Building[] = [];
      for (const b of buildings) {
        if (!seenParcels.has(b.parcel_id)) {
          seenParcels.add(b.parcel_id);
          sanitizedBuildings.push(b);
        } else {
          console.warn(`[3D Cadastre] Filtered overlapping building ${b.building_id} on occupied parcel ${b.parcel_id}`);
        }
      }

      const validBuildingIds = new Set(sanitizedBuildings.map(b => b.building_id.toUpperCase()));
      const sanitizedFloors = floors.filter(f => validBuildingIds.has(f.building_id?.toUpperCase()));
      const validFloorIds = new Set(sanitizedFloors.map(f => f.floor_id));
      const sanitizedVPs = verticalProperties.filter(vp => validFloorIds.has(vp.floor_id) || validBuildingIds.has(vp.building_id?.toUpperCase()));
      const validVpIds = new Set(sanitizedVPs.map(vp => vp.vertical_parcel_id));
      const sanitizedProps = properties.filter(p => !p.vertical_parcel_id || validVpIds.has(p.vertical_parcel_id));

      set({
        parcels,
        buildings: sanitizedBuildings,
        floors: sanitizedFloors,
        verticalProperties: sanitizedVPs,
        properties: sanitizedProps,
        undergroundAssets: underground,
        gnssStations: gnss,
        terrainData: terrain,
        lidarPoints: lidar,
        dashboardMetrics: metrics ? {
          ...metrics,
          total_buildings: sanitizedBuildings.length,
          total_floors: sanitizedFloors.length,
          total_vertical_properties: sanitizedVPs.length,
          total_ulpins: sanitizedProps.length,
        } : metrics,
        isLiveBackend: isLive,
        isLoading: false,
        error: null,
      });

      // Load initial selected building details if nothing currently selected
      if (sanitizedBuildings.length > 0 && !get().selectedBuildingId && !get().selectedProperty) {
        get().selectBuilding(sanitizedBuildings[0].building_id);
      }
    } catch (err: any) {
      console.warn('fetchAllData encountered an error, keeping active dataset:', err);
      set({ isLoading: false, error: null });
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  selectParcel: (parcelId) => {
    const parcel = get().parcels.find(p => p.parcel_id === parcelId);
    const relatedBuilding = get().buildings.find(b => b.parcel_id === parcelId);
    set({
      selectedParcelId: parcelId,
      selectedBuildingId: relatedBuilding ? relatedBuilding.building_id : null,
      selectedFloorId: null,
      selectedVerticalParcelId: null,
      isDetailsOpen: true,
      selectedProperty: parcel ? {
        type: 'Parcel',
        id: parcel.parcel_id,
        survey_number: parcel.survey_number,
        area: parcel.area,
        land_use: parcel.land_use,
        status: parcel.status,
        ulpin: format14DigitUlpin(parcel.parcel_id, 'F00', 'P01'),
      } : null
    });
  },

  selectBuilding: (buildingId) => {
    const building = get().buildings.find(b => b.building_id === buildingId);
    if (!building) return;

    set({
      selectedBuildingId: buildingId,
      selectedParcelId: building.parcel_id,
      selectedFloorId: null,
      selectedVerticalParcelId: null,
      isDetailsOpen: true,
      selectedProperty: {
        type: 'Building',
        id: building.building_id,
        parcel_id: building.parcel_id,
        height: building.height,
        floor_count: building.floor_count,
        ground_elevation: building.ground_elevation,
        roof_elevation: building.roof_elevation,
        building_type: building.building_type,
        ulpin: format14DigitUlpin(building.building_id, 'F01', 'P01'),
      }
    });
  },

  selectFloor: (floorId) => {
    const floor = get().floors.find(f => f.floor_id === floorId);
    if (!floor) return;

    const building = get().buildings.find(b => b.building_id === floor.building_id);
    const vertProp = get().verticalProperties.find(v => v.floor_id === floorId);
    const propRecord = vertProp ? get().properties.find(p => p.vertical_parcel_id === vertProp.vertical_parcel_id) : null;

    set({
      selectedFloorId: floorId,
      selectedBuildingId: floor.building_id,
      selectedParcelId: building ? building.parcel_id : null,
      selectedVerticalParcelId: vertProp ? vertProp.vertical_parcel_id : null,
      isDetailsOpen: true,
      selectedProperty: {
        type: 'Floor',
        id: floor.floor_id,
        building_id: floor.building_id,
        floor_number: floor.floor_number,
        z_min: floor.z_min,
        z_max: floor.z_max,
        area: floor.area,
        volume: floor.area * (floor.z_max - floor.z_min),
        ulpin: propRecord ? propRecord.ulpin : format14DigitUlpin(floor.building_id, floor.floor_id, 'P01'),
        owner: propRecord ? propRecord.owner_name : 'Municipal Resident',
        status: 'Verified Cadastral Record',
      }
    });
  },

  selectVerticalParcel: (vpId) => {
    const vert = get().verticalProperties.find(v => v.vertical_parcel_id === vpId);
    if (!vert) return;

    const propRecord = get().properties.find(p => p.vertical_parcel_id === vpId);
    set({
      selectedVerticalParcelId: vpId,
      selectedFloorId: vert.floor_id,
      selectedBuildingId: vert.building_id,
      selectedParcelId: vert.parcel_id,
      isDetailsOpen: true,
      selectedProperty: {
        type: 'Vertical Parcel',
        id: vert.vertical_parcel_id,
        ulpin: propRecord ? propRecord.ulpin : format14DigitUlpin(vert.building_id, vert.floor_id, vert.vertical_parcel_id),
        building_id: vert.building_id,
        floor_id: vert.floor_id,
        parcel_id: vert.parcel_id,
        z_min: vert.z_min,
        z_max: vert.z_max,
        area: vert.area,
        volume: vert.volume,
        property_type: vert.property_type,
        owner: propRecord ? propRecord.owner_name : 'Registered Property Holder',
        status: propRecord ? propRecord.verification_status : 'Verified Cadastral Record',
      }
    });
  },

  selectProperty: (prop) => set({ selectedProperty: prop, isDetailsOpen: true }),
  setHoveredId: (id) => set({ hoveredId: id }),

  toggleLayer: (layerKey) =>
    set((state) => ({
      layers: { ...state.layers, [layerKey]: !state.layers[layerKey] }
    })),

  setFloorView: (enabled) => set({ isFloorView: enabled }),
  setExplodedView: (enabled) => set({ isExplodedView: enabled }),
  setExplodeAmount: (amount) => set({ explodeAmount: amount }),
  setZClip: (min, max) => set({ zMinClip: min, zMaxClip: max }),
  setWireframe: (enabled) => set({ isWireframe: enabled }),
  setTransparent: (enabled) => set({ isTransparent: enabled }),
  setCameraPreset: (preset) => set({ cameraPreset: preset }),

  setMeasureMode: (mode) => set({ measureMode: mode, measurePoints: [] }),
  addMeasurePoint: (pt) => set((state) => ({ measurePoints: [...state.measurePoints, pt] })),
  clearMeasurePoints: () => set({ measurePoints: [] }),

  setImportModalOpen: (open) => set({ isImportModalOpen: open }),
  setReportModalOpen: (open) => set({ isReportModalOpen: open }),
  setValidationModalOpen: (open) => set({ isValidationModalOpen: open }),

  searchGlobal: async (query: string) => {
    if (!query.trim()) return false;
    const clean = query.trim().toUpperCase();

    // Check ULPIN in local properties
    const matchedProp = get().properties.find(p => p.ulpin.toUpperCase().includes(clean));
    if (matchedProp) {
      get().selectVerticalParcel(matchedProp.vertical_parcel_id);
      return true;
    }

    // Check Buildings
    const matchedBldg = get().buildings.find(b => b.building_id.toUpperCase() === clean);
    if (matchedBldg) {
      get().selectBuilding(matchedBldg.building_id);
      return true;
    }

    // Check Parcels
    const matchedParcel = get().parcels.find(p => p.parcel_id.toUpperCase() === clean || p.survey_number.toUpperCase().includes(clean));
    if (matchedParcel) {
      get().selectParcel(matchedParcel.parcel_id);
      return true;
    }

    // Check Floors
    const matchedFloor = get().floors.find(f => f.floor_id.toUpperCase() === clean);
    if (matchedFloor) {
      get().selectFloor(matchedFloor.floor_id);
      return true;
    }

    // Attempt backend search
    try {
      const res = await CadastralApi.searchUlpin(clean);
      if (res && res.ulpin) {
        set({
          selectedProperty: {
            type: 'Vertical Parcel',
            id: res.property_id,
            ulpin: res.ulpin,
            building_id: res.building?.building_id,
            floor_id: res.floor?.floor_id,
            parcel_id: res.parcel?.parcel_id,
            z_min: res.vertical_parcel?.z_min,
            z_max: res.vertical_parcel?.z_max,
            area: res.vertical_parcel?.area,
            volume: res.vertical_parcel?.volume,
            owner: res.owner_name,
            status: res.verification_status,
          },
          selectedBuildingId: res.building?.building_id,
          selectedParcelId: res.parcel?.parcel_id,
        });
        return true;
      }
    } catch {
      // not found
    }

    return false;
  },

  generateUlpinForCurrent: async (ownerName = "Govt Allocated Citizen", propertyType = "Residential Unit") => {
    const { selectedBuildingId, selectedFloorId } = get();
    if (!selectedBuildingId || !selectedFloorId) return null;

    const floor = get().floors.find(f => f.floor_id === selectedFloorId);
    const fNum = floor ? floor.floor_number : 1;
    const propSub = `U${Math.floor(Math.random() * 900 + 100)}`;

    try {
      const res = await CadastralApi.generateUlpin({
        building_id: selectedBuildingId,
        floor_id: `F${String(fNum).padStart(2, '0')}`,
        property_id: propSub,
        owner_name: ownerName,
        property_type: propertyType
      });

      // Refresh data to reflect new record
      await get().fetchAllData();
      return res.ulpin;
    } catch (err: any) {
      console.error('Failed to generate ULPIN:', err);
      return null;
    }
  },

  runValidationCheck: async () => {
    try {
      const results = await CadastralApi.runValidation();
      set({ validationResults: results, isValidationModalOpen: true });
    } catch (err: any) {
      console.error('Validation error:', err);
    }
  },

  addNewBuilding: (data) => {
    const { building, floors, vertical_parcels, property_records, validation } = data;
    // Overlap prevention: If target parcel is already occupied by a different building, reassign to vacant parcel
    let targetBuilding = { ...building };
    let targetFloors = [...floors];
    let targetVPs = [...vertical_parcels];

    const isOccupied = get().buildings.some(b => b.parcel_id === targetBuilding.parcel_id && b.building_id !== targetBuilding.building_id);
    if (isOccupied) {
      const occupiedPids = new Set(get().buildings.map(b => b.parcel_id));
      const freeParcel = get().parcels.find(p => !occupiedPids.has(p.parcel_id));
      if (freeParcel) {
        targetBuilding.parcel_id = freeParcel.parcel_id;
        // Generate non-overlapping footprint centered in free parcel
        const pCoords = freeParcel.geometry.coordinates[0];
        const lats = pCoords.map((c: any) => c[1]);
        const lons = pCoords.map((c: any) => c[0]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const cLat = (minLat + maxLat) / 2;
        const cLon = (minLon + maxLon) / 2;
        const dLat = (maxLat - minLat) * 0.35;
        const dLon = (maxLon - minLon) * 0.35;
        const newGeom = {
          type: 'Polygon',
          coordinates: [[
            [cLon - dLon, cLat - dLat],
            [cLon + dLon, cLat - dLat],
            [cLon + dLon, cLat + dLat],
            [cLon - dLon, cLat + dLat],
            [cLon - dLon, cLat - dLat]
          ]]
        };
        targetBuilding.geometry = newGeom;
        targetFloors = targetFloors.map(f => ({ ...f, geometry: newGeom }));
        targetVPs = targetVPs.map(vp => ({ ...vp, geometry: newGeom }));
      }
    }

    const currentBuildings = get().buildings.filter(b => b.building_id !== targetBuilding.building_id && b.parcel_id !== targetBuilding.parcel_id);
    const updatedBuildings = [targetBuilding, ...currentBuildings];

    const currentFloors = get().floors.filter(f => f.building_id !== targetBuilding.building_id);
    const updatedFloors = [...targetFloors, ...currentFloors];

    const currentVPs = get().verticalProperties.filter(vp => vp.building_id !== targetBuilding.building_id);
    const updatedVPs = [...targetVPs, ...currentVPs];

    const currentProps = get().properties.filter(p => !property_records.some(pr => pr.ulpin === p.ulpin));
    const updatedProps = [...property_records, ...currentProps];

    const updatedValidations = validation ? [...validation, ...get().validationResults] : get().validationResults;

    const metrics = get().dashboardMetrics;
    const updatedMetrics = metrics ? {
      ...metrics,
      total_buildings: updatedBuildings.length,
      total_floors: updatedFloors.length,
      total_vertical_properties: updatedVPs.length,
      total_ulpins: updatedProps.length,
    } : null;

    set({
      buildings: updatedBuildings,
      floors: updatedFloors,
      verticalProperties: updatedVPs,
      properties: updatedProps,
      validationResults: updatedValidations,
      dashboardMetrics: updatedMetrics,
      selectedBuildingId: building.building_id,
      selectedParcelId: building.parcel_id,
      selectedFloorId: floors[0]?.floor_id || null,
      selectedVerticalParcelId: vertical_parcels[0]?.vertical_parcel_id || null,
      isDetailsOpen: true,
      selectedProperty: {
        type: 'Building',
        id: building.building_id,
        parcel_id: building.parcel_id,
        height: building.height,
        floor_count: building.floor_count,
        building_type: building.building_type,
        elevation: building.ground_elevation,
        ulpin: property_records[0]?.ulpin || format14DigitUlpin(building.parcel_id, 'F01', 'U01')
      }
    });
  },

  removeBuilding: async (buildingId: string) => {
    const bid = buildingId.trim();
    const bidUpper = bid.toUpperCase();
    let apiResult = { success: true, message: `Building ${bid} removed`, deleted_ulpins: [] as string[] };
    try {
      apiResult = await CadastralApi.deleteBuilding(bid);
    } catch (e) {
      console.warn('Backend delete error:', e);
    }

    // 1. Identify associated floors and vertical parcels
    const floorsToDelete = get().floors.filter(f => f.building_id?.toUpperCase() === bidUpper);
    const floorIds = new Set(floorsToDelete.map(f => f.floor_id));

    const vpsToDelete = get().verticalProperties.filter(vp => 
      vp.building_id?.toUpperCase() === bidUpper || floorIds.has(vp.floor_id)
    );
    const vpIds = new Set(vpsToDelete.map(vp => vp.vertical_parcel_id));

    // 2. Cascade remove building, floors, vertical properties, and property records/ULPINs
    const updatedBuildings = get().buildings.filter(b => b.building_id?.toUpperCase() !== bidUpper && String(b.id) !== bid);
    const updatedFloors = get().floors.filter(f => f.building_id?.toUpperCase() !== bidUpper && !floorIds.has(f.floor_id));
    const updatedVPs = get().verticalProperties.filter(vp => !vpIds.has(vp.vertical_parcel_id) && vp.building_id?.toUpperCase() !== bidUpper);
    const updatedProps = get().properties.filter(p => !vpIds.has(p.vertical_parcel_id) && !p.property_id?.toUpperCase().includes(bidUpper));

    // 3. Update dashboard metrics
    const metrics = get().dashboardMetrics;
    const updatedMetrics = metrics ? {
      ...metrics,
      total_buildings: updatedBuildings.length,
      total_floors: updatedFloors.length,
      total_vertical_properties: updatedVPs.length,
      total_ulpins: updatedProps.length,
    } : null;

    // 4. If removed building was selected, deselect it
    const wasSelected = (
      get().selectedBuildingId?.toUpperCase() === bidUpper ||
      get().selectedProperty?.id?.toUpperCase() === bidUpper ||
      (get().selectedFloorId && floorIds.has(get().selectedFloorId!)) ||
      (get().selectedVerticalParcelId && vpIds.has(get().selectedVerticalParcelId!))
    );

    set({
      buildings: updatedBuildings,
      floors: updatedFloors,
      verticalProperties: updatedVPs,
      properties: updatedProps,
      dashboardMetrics: updatedMetrics,
      selectedBuildingId: wasSelected ? null : get().selectedBuildingId,
      selectedFloorId: wasSelected ? null : get().selectedFloorId,
      selectedVerticalParcelId: wasSelected ? null : get().selectedVerticalParcelId,
      selectedProperty: wasSelected ? null : get().selectedProperty,
      isDetailsOpen: wasSelected ? false : get().isDetailsOpen
    });

    return apiResult;
  },

  isMeasuringPolygon: false,
  measurePolygonPoints: [],
  pendingAiBuildingInput: null,
  setIsMeasuringPolygon: (active) => set({
    isMeasuringPolygon: active,
    measureMode: active ? 'distance' : 'none'
  }),
  addMeasurePolygonPoint: (point) => set({
    measurePolygonPoints: [...get().measurePolygonPoints, point]
  }),
  removeLastMeasurePolygonPoint: () => {
    const pts = [...get().measurePolygonPoints];
    pts.pop();
    set({ measurePolygonPoints: pts });
  },
  clearMeasurePolygon: () => set({ measurePolygonPoints: [] }),
  setPendingAiBuildingInput: (data) => set({ pendingAiBuildingInput: data })
}));

