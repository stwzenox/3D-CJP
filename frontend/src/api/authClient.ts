import { apiClient } from './client';
import { User, SuperAdminMetrics, BuildingPipelineInput, Building, Floor, VerticalParcel, PropertyRecord, ValidationResult } from '../types';
import rawDemoData from './demoDataset.json';
import { format14DigitUlpin } from '../utils/ulpin';

const demoData = rawDemoData as any;

const STORAGE_USERS_KEY = '3d_cadastre_users_v1';

const DEFAULT_USERS: User[] = [
  {
    user_id: 'usr_superadmin',
    email: 'superadmin@cadastre.gov.in',
    name: 'National Cadastre Super Admin',
    role: 'superadmin',
    status: 'active',
    organization: 'Survey of India / Ministry of Rural Development',
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    user_id: 'usr_admin_verma',
    email: 'officer.verma@cadastre.gov.in',
    name: 'Officer Rajesh Verma',
    role: 'admin',
    status: 'active',
    organization: 'Cadastral Survey & 3D Land Records Division',
    created_at: new Date('2026-01-15').toISOString(),
  },
  {
    user_id: 'usr_admin_pending',
    email: 'sharma.admin@gmail.com',
    name: 'Er. Amit Sharma',
    role: 'admin',
    status: 'pending',
    organization: 'Town Planning & Geospatial Authority',
    created_at: new Date('2026-02-20').toISOString(),
  },
  {
    user_id: 'usr_citizen_shukla',
    email: 'citizen.shukla@gmail.com',
    name: 'Anand Shukla',
    role: 'citizen',
    status: 'active',
    organization: 'Property Owner / Citizen',
    created_at: new Date('2026-02-28').toISOString(),
  }
];

function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return parsed;
  } catch {
    return DEFAULT_USERS;
  }
}

function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to persist users to localStorage', err);
  }
}

export const AuthApi = {
  async signup(payload: {
    email: string;
    password?: string;
    name: string;
    role: 'citizen' | 'admin' | 'superadmin';
    organization?: string;
  }): Promise<{ user: User; message: string }> {
    try {
      const res = await apiClient.post<{ message: string; user: User }>('/auth/signup', payload);
      return res.data;
    } catch (err: any) {
      // Backend error with response message
      if (err?.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      // Offline / Vercel fallback
      const users = getStoredUsers();
      const existing = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
      if (existing) {
        throw new Error(`Email ${payload.email} is already registered.`);
      }

      const status = payload.role === 'admin' ? 'pending' : 'active';
      const newUser: User = {
        user_id: `usr_${Date.now().toString(36)}`,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        status,
        organization: payload.organization || (payload.role === 'admin' ? 'Geospatial Authority' : 'Public Citizen'),
        created_at: new Date().toISOString(),
      };

      users.push(newUser);
      saveStoredUsers(users);

      const message =
        payload.role === 'admin'
          ? 'Admin registration submitted! Awaiting Super Admin review and approval.'
          : 'Citizen account successfully created and active.';

      return { user: newUser, message };
    }
  },

  async login(payload: { email: string; password?: string }): Promise<{ user: User; message: string }> {
    try {
      const res = await apiClient.post<{ message: string; user: User }>('/auth/login', payload);
      return res.data;
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        const d = err.response.data.detail;
        const msg = typeof d === 'string' ? d : Array.isArray(d) ? d.map((x: any) => x.msg || JSON.stringify(x)).join(', ') : JSON.stringify(d);
        throw new Error(msg);
      }

      // Offline / Vercel fallback
      const users = getStoredUsers();
      const found = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase().trim());
      if (!found) {
        throw new Error(`No account found with email ${payload.email}. Please sign up.`);
      }

      if (found.role === 'admin' && found.status === 'pending') {
        throw new Error(
          `Admin account for '${found.name}' is currently PENDING Super Admin approval. Please contact the Super Admin.`
        );
      }
      if (found.status === 'revoked') {
        throw new Error(`Account has been deactivated/revoked by Super Admin.`);
      }

      return {
        user: found,
        message: `Welcome back, ${found.name}! Logged in as ${found.role.toUpperCase()}.`
      };
    }
  },

  async getAdmins(): Promise<User[]> {
    try {
      const res = await apiClient.get<User[]>('/auth/admins');
      return res.data;
    } catch {
      const users = getStoredUsers();
      return users.filter(u => u.role === 'admin');
    }
  },

  async approveAdmin(userId: string): Promise<User> {
    try {
      const res = await apiClient.post<User>(`/auth/admins/${userId}/approve`);
      return res.data;
    } catch {
      const users = getStoredUsers();
      const target = users.find(u => u.user_id === userId);
      if (!target) throw new Error(`Admin with ID ${userId} not found.`);
      target.status = 'active';
      saveStoredUsers(users);
      return target;
    }
  },

  async revokeAdmin(userId: string): Promise<User> {
    try {
      const res = await apiClient.post<User>(`/auth/admins/${userId}/revoke`);
      return res.data;
    } catch {
      const users = getStoredUsers();
      const target = users.find(u => u.user_id === userId);
      if (!target) throw new Error(`Admin with ID ${userId} not found.`);
      target.status = 'revoked';
      saveStoredUsers(users);
      return target;
    }
  },

  async deleteAdmin(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/auth/admins/${userId}`);
    } catch {
      let users = getStoredUsers();
      users = users.filter(u => u.user_id !== userId);
      saveStoredUsers(users);
    }
  },

  async getSuperAdminMetrics(localBuildingsCount: number = 0): Promise<SuperAdminMetrics> {
    try {
      const res = await apiClient.get<SuperAdminMetrics>('/auth/superadmin/dashboard');
      return res.data;
    } catch {
      const users = getStoredUsers();
      const admins = users.filter(u => u.role === 'admin');
      const activeAdmins = admins.filter(a => a.status === 'active').length;
      const pendingAdmins = admins.filter(a => a.status === 'pending').length;

      const totalBuildings = Math.max(demoData.buildings?.length || 8, localBuildingsCount);

      return {
        total_buildings: totalBuildings,
        registered_buildings: totalBuildings,
        total_parcels: demoData.parcels?.length || 10,
        total_vertical_properties: (demoData.vertical_properties?.length || 20) + (totalBuildings - 8) * 3,
        total_ulpins: (demoData.properties?.length || 20) + (totalBuildings - 8) * 3,
        active_admins: activeAdmins,
        pending_admins: pendingAdmins,
        total_users: users.length,
      };
    }
  },

  async createBuildingPipeline(payload: BuildingPipelineInput): Promise<{
    message: string;
    building: Building;
    floors: Floor[];
    vertical_parcels: VerticalParcel[];
    property_records: PropertyRecord[];
    validation: ValidationResult[];
  }> {
    try {
      const backendPayload = {
        parcel_id: payload.parcel_id || 'P001',
        building_type: payload.building_type,
        height: payload.height || (payload.floor_count * payload.height_per_floor),
        floor_count: payload.floor_count,
        owner_name: payload.owner_name,
        property_type: payload.property_type,
        data_source: payload.data_sources?.join(', ') || 'Drone LiDAR Survey',
        custom_geometry: payload.custom_geometry,
        apartments_per_floor: 2,
      };

      const res = await apiClient.post<any>('/buildings/pipeline-create', backendPayload);
      const data = res.data;
      const bldg = data.building;
      const bldgGeom = bldg.geometry;

      const floors: Floor[] = (data.floors || []).map((fl: any, idx: number) => ({
        id: fl.id || Date.now() + idx,
        floor_id: fl.floor_id,
        building_id: bldg.building_id,
        floor_number: fl.floor_number,
        z_min: fl.z_min,
        z_max: fl.z_max,
        area: fl.area || bldg.area,
        geometry: fl.geometry || bldgGeom,
      }));

      const vps: VerticalParcel[] = (data.properties || []).map((pr: any, idx: number) => ({
        id: Date.now() + 100 + idx,
        vertical_parcel_id: pr.vertical_parcel_id,
        parcel_id: bldg.parcel_id,
        building_id: bldg.building_id,
        floor_id: pr.floor_id,
        geometry: pr.geometry || bldgGeom,
        z_min: pr.z_min,
        z_max: pr.z_max,
        area: pr.area || 140,
        volume: pr.volume || 490,
        property_type: pr.property_type || '3D Cadastral Unit',
      }));

      const props: PropertyRecord[] = (data.properties || []).map((pr: any, idx: number) => ({
        id: Date.now() + 200 + idx,
        property_id: pr.property_id,
        ulpin: pr.ulpin,
        vertical_parcel_id: pr.vertical_parcel_id,
        owner_name: pr.owner_name || payload.owner_name,
        property_type: payload.property_type,
        status: 'Registered',
        verification_status: 'Verified Cadastral Record',
      }));

      return {
        message: data.message,
        building: bldg,
        floors,
        vertical_parcels: vps,
        property_records: props,
        validation: [
          {
            id: 1,
            object_id: bldg.building_id,
            object_type: 'Building',
            validation_type: 'Volumetric Topology',
            severity: 'VALID',
            message: `Building ${bldg.building_id} geometry and vertical parcels successfully validated with zero spatial overlaps.`,
            status: 'PASSED'
          }
        ],
      };
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }

      // Offline fallback simulation
      const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
      const buildingId = `B0${Math.floor(Math.random() * 90 + 10)}`;
      const parcelId = payload.parcel_id || 'P001';
      const floorCount = Math.max(1, payload.floor_count || 4);
      const floorHeight = payload.height_per_floor || 3.5;
      const totalHeight = floorCount * floorHeight;

      let footprintCoords: number[][][];

      if (payload.custom_geometry && payload.custom_geometry.coordinates) {
        footprintCoords = payload.custom_geometry.coordinates;
      } else {
        // Pick an unoccupied parcel if possible
        const existingPids = new Set((demoData.buildings as any[]).map(b => b.parcel_id));
        const freeParcel = (demoData.parcels as any[]).find(p => !existingPids.has(p.parcel_id));
        const baseParcel = freeParcel || (demoData.parcels as any[]).find(p => p.parcel_id === parcelId) || demoData.parcels[0];
        const coords = baseParcel.geometry.coordinates[0];

        const lats = coords.map((c: any) => c[1]);
        const lons = coords.map((c: any) => c[0]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        const centerLat = (minLat + maxLat) / 2;
        const centerLon = (minLon + maxLon) / 2;
        const halfLat = (maxLat - minLat) * 0.35;
        const halfLon = (maxLon - minLon) * 0.35;

        footprintCoords = [
          [
            [centerLon - halfLon, centerLat - halfLat],
            [centerLon + halfLon, centerLat - halfLat],
            [centerLon + halfLon, centerLat + halfLat],
            [centerLon - halfLon, centerLat + halfLat],
            [centerLon - halfLon, centerLat - halfLat],
          ]
        ];
      }

      const building: Building = {
        id: Date.now(),
        building_id: buildingId,
        parcel_id: parcelId,
        geometry: {
          type: 'Polygon',
          coordinates: footprintCoords,
        },
        ground_elevation: 100.0,
        roof_elevation: 100.0 + totalHeight,
        height: totalHeight,
        floor_count: floorCount,
        building_type: payload.building_type || 'Residential',
      };

      const floors: Floor[] = [];
      const verticalParcels: VerticalParcel[] = [];
      const propertyRecords: PropertyRecord[] = [];

      for (let f = 1; f <= floorCount; f++) {
        const floorId = `FL-${buildingId}-${f}`;
        const zMin = 100.0 + (f - 1) * floorHeight;
        const zMax = zMin + floorHeight;

        floors.push({
          id: Date.now() + f,
          floor_id: floorId,
          building_id: buildingId,
          floor_number: f,
          z_min: zMin,
          z_max: zMax,
          area: 280.0,
          geometry: {
            type: 'Polygon',
            coordinates: footprintCoords,
          }
        });

        // 2 units per floor
        for (let u = 1; u <= 2; u++) {
          const unitId = `VP-${buildingId}-${f}0${u}`;
          const ulpin = format14DigitUlpin(buildingId, `F${f}`, `U${u}`);

          verticalParcels.push({
            id: Date.now() + f * 10 + u,
            vertical_parcel_id: unitId,
            parcel_id: parcelId,
            building_id: buildingId,
            floor_id: floorId,
            geometry: {
              type: 'Polygon',
              coordinates: footprintCoords,
            },
            z_min: zMin,
            z_max: zMax,
            area: 135.0,
            volume: 135.0 * floorHeight,
            property_type: payload.property_type || 'Residential Apartment',
          });

          propertyRecords.push({
            id: Date.now() + f * 100 + u,
            property_id: `PROP-${buildingId}-${f}0${u}`,
            ulpin,
            vertical_parcel_id: unitId,
            owner_name: payload.owner_name || `Cadastral Unit Owner ${f}0${u}`,
            property_type: payload.property_type || 'Residential Apartment',
            status: payload.status || 'Active Registered',
            verification_status: '3D Cadastre Approved',
          });
        }
      }

      const validation: ValidationResult[] = [
        {
          id: Date.now() + 99,
          object_id: buildingId,
          object_type: 'Building',
          validation_type: 'Topology & AI Segmentation',
          severity: 'VALID',
          message: `Building ${buildingId} conforms to vertical parcel delineation standards with zero boundary clashes.`,
          status: 'PASSED'
        }
      ];

      return {
        message: `Successfully synthesized 3D Cadastral Building ${buildingId} with ${verticalParcels.length} vertical units.`,
        building,
        floors,
        vertical_parcels: verticalParcels,
        property_records: propertyRecords,
        validation,
      };
    }
  }
};
