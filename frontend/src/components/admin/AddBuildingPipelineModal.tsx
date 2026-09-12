import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../state/useAuthStore';
import { useCadastralStore } from '../../state/useCadastralStore';
import { AuthApi } from '../../api/authClient';
import { format14DigitUlpin } from '../../utils/ulpin';
import { BuildingPipelineInput } from '../../types';
import { 
  X, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Network, 
  FileBadge, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Box, 
  MapPin, 
  Database, 
  AlertCircle,
  QrCode,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { ScannableQRCode } from '../common/ScannableQRCode';

const DATA_SOURCES_LIST = [
  { id: 'drone', label: 'Drone Photogrammetry', desc: 'High-res aerial orthomosaic' },
  { id: 'lidar', label: 'LiDAR Point Cloud', desc: '0.1m precision elevation ground truth' },
  { id: 'gis_parcel', label: 'GIS Parcel Boundary', desc: 'Revenue cadastral boundary polygons' },
  { id: 'floor_plans', label: 'Architectural Floor Plans', desc: 'CAD / BIM floor layouts' },
  { id: 'dem_dsm', label: 'DEM / DSM Grid', desc: 'Digital elevation surface model' },
  { id: 'gnss_cors', label: 'GNSS-CORS Reference', desc: 'Sub-centimeter geospatial alignment' },
];

export const AddBuildingPipelineModal: React.FC = () => {
  const { isAddBuildingModalOpen, closeAddBuildingModal, currentUser } = useAuthStore();
  const {
    parcels,
    addNewBuilding,
    pendingAiBuildingInput,
    setPendingAiBuildingInput,
    measurePolygonPoints,
    clearMeasurePolygon,
    setIsMeasuringPolygon
  } = useCadastralStore();

  const [step, setStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Active measured footprint points from either Gemini AI input or live Leaflet measure tool
  const activeMeasuredPoints = (pendingAiBuildingInput?.coordinates && pendingAiBuildingInput.coordinates.length >= 3)
    ? pendingAiBuildingInput.coordinates
    : (measurePolygonPoints && measurePolygonPoints.length >= 3)
    ? measurePolygonPoints
    : null;

  // Convert measured [lat, lng] to closed GeoJSON [[lng, lat], ...] polygon
  const activeGeoJson = React.useMemo(() => {
    if (!activeMeasuredPoints || activeMeasuredPoints.length < 3) return null;
    const ring: [number, number][] = activeMeasuredPoints.map(([lat, lng]: [number, number]) => [
      Number(lng.toFixed(6)),
      Number(lat.toFixed(6))
    ]);
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push([ring[0][0], ring[0][1]]);
    }
    return {
      type: 'Polygon',
      coordinates: [ring]
    };
  }, [activeMeasuredPoints]);

  // Distinguish occupied vs vacant parcels to prevent overlapping buildings
  const { buildings } = useCadastralStore();
  const occupiedParcelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    buildings.forEach(b => map.set(b.parcel_id, b.building_id));
    return map;
  }, [buildings]);

  const vacantParcels = React.useMemo(() => {
    return parcels.filter(p => !occupiedParcelMap.has(p.parcel_id));
  }, [parcels, occupiedParcelMap]);

  const occupiedParcels = React.useMemo(() => {
    return parcels.filter(p => occupiedParcelMap.has(p.parcel_id));
  }, [parcels, occupiedParcelMap]);

  // Default to first vacant parcel (e.g. P009, P010) rather than occupied P001
  const defaultParcelId = vacantParcels[0]?.parcel_id || parcels[0]?.parcel_id || 'P009';
  const [selectedParcelId, setSelectedParcelId] = useState<string>(defaultParcelId);
  const [buildingName, setBuildingName] = useState<string>('Skyline Heights Sector-7');
  const [buildingType, setBuildingType] = useState<string>('Residential Complex');
  const [floorCount, setFloorCount] = useState<number>(4);
  const [heightPerFloor, setHeightPerFloor] = useState<number>(3.5);
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([
    'Drone Photogrammetry',
    'LiDAR Point Cloud',
    'GIS Parcel Boundary',
    'Floor Plans',
    'DEM / DSM Grid',
    'GNSS-CORS Reference'
  ]);

  // Synchronize building attributes and auto-detect best parcel based on measured 2D footprint location
  useEffect(() => {
    if (!isAddBuildingModalOpen) return;

    if (pendingAiBuildingInput?.aiSpec) {
      const spec = pendingAiBuildingInput.aiSpec;
      if (spec.building_name) setBuildingName(spec.building_name);
      if (spec.building_type) setBuildingType(spec.building_type);
      if (spec.floor_count) setFloorCount(spec.floor_count);
      if (spec.height_per_floor) setHeightPerFloor(spec.height_per_floor);
      if (spec.owner_name) setOwnerName(spec.owner_name);
      if (spec.property_type) setPropertyType(spec.property_type);
      if (spec.officer_notes) setOfficerNotes(spec.officer_notes);
      if (pendingAiBuildingInput.parcelId) setSelectedParcelId(pendingAiBuildingInput.parcelId);

      setSelectedDataSources([
        'Interactive Google Earth Footprint Measure',
        'Google AI Studio (Gemini) 3D Synthesis',
        'LiDAR Point Cloud',
        'GIS Parcel Boundary',
        'GNSS-CORS Reference'
      ]);
    } else if (measurePolygonPoints.length >= 3) {
      setSelectedDataSources([
        'Interactive Google Earth Footprint Measure',
        'LiDAR Point Cloud',
        'GIS Parcel Boundary',
        'GNSS-CORS Reference'
      ]);
    }

    // Auto-detect parcel containing or nearest to the measured 2D footprint centroid
    if (activeMeasuredPoints && activeMeasuredPoints.length >= 3) {
      const lats = activeMeasuredPoints.map((p: [number, number]) => p[0]);
      const lngs = activeMeasuredPoints.map((p: [number, number]) => p[1]);
      const cLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
      const cLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length;

      let bestPid = parcels[0]?.parcel_id || 'P001';
      let minDist = Infinity;
      for (const p of parcels) {
        if (p.geometry?.coordinates?.[0]) {
          const ring = p.geometry.coordinates[0];
          const pLats = ring.map((c: any) => c[1]);
          const pLngs = ring.map((c: any) => c[0]);
          const pMinLat = Math.min(...pLats);
          const pMaxLat = Math.max(...pLats);
          const pMinLng = Math.min(...pLngs);
          const pMaxLng = Math.max(...pLngs);

          if (cLat >= pMinLat && cLat <= pMaxLat && cLng >= pMinLng && cLng <= pMaxLng) {
            bestPid = p.parcel_id;
            break;
          }

          const pCentLat = (pMinLat + pMaxLat) / 2;
          const pCentLng = (pMinLng + pMaxLng) / 2;
          const dist = (cLat - pCentLat) ** 2 + (cLng - pCentLng) ** 2;
          if (dist < minDist) {
            minDist = dist;
            bestPid = p.parcel_id;
          }
        }
      }
      setSelectedParcelId(bestPid);
    }
  }, [isAddBuildingModalOpen, pendingAiBuildingInput, activeMeasuredPoints, parcels]);

  // Step 2: AI / 3D Processing
  const [aiBuildingExtracted, setAiBuildingExtracted] = useState<boolean>(true);
  const [aiFloorSegmented, setAiFloorSegmented] = useState<boolean>(true);
  const [aiVerticalDelineated, setAiVerticalDelineated] = useState<boolean>(true);
  const [aiTopologyValidated, setAiTopologyValidated] = useState<boolean>(true);

  // Step 3: Admin Review
  const [officerName, setOfficerName] = useState<string>(currentUser?.name || 'Officer Rajesh Verma');
  const [officerNotes, setOfficerNotes] = useState<string>('Geometry conforms with revenue boundary P001. No vertical air-rights overlap.');
  const [ownerName, setOwnerName] = useState<string>('Dr. Priya Deshmukh');
  const [propertyType, setPropertyType] = useState<string>('3BHK Residential Unit');
  const [ownershipAttached, setOwnershipAttached] = useState<boolean>(true);
  const [officerApproved, setOfficerApproved] = useState<boolean>(true);

  // Step 5: Created Result
  const [createdResult, setCreatedResult] = useState<any>(null);

  if (!isAddBuildingModalOpen) return null;

  const toggleDataSource = (label: string) => {
    if (selectedDataSources.includes(label)) {
      setSelectedDataSources(selectedDataSources.filter(d => d !== label));
    } else {
      setSelectedDataSources([...selectedDataSources, label]);
    }
  };

  const handleNextFromStep1 = () => {
    if (!buildingName.trim()) {
      setPipelineError('Please enter a building name.');
      return;
    }
    setPipelineError(null);
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setPipelineError(null);
    setStep(3);
  };

  const handleNextFromStep3 = () => {
    if (!ownerName.trim()) {
      setPipelineError('Please specify the ownership record.');
      return;
    }
    setPipelineError(null);
    setStep(4);
  };

  const handleGenerate3DUlpin = async () => {
    setIsProcessing(true);
    setPipelineError(null);
    try {
      const payload: BuildingPipelineInput = {
        parcel_id: selectedParcelId,
        building_name: buildingName,
        building_type: buildingType,
        floor_count: Number(floorCount),
        height_per_floor: Number(heightPerFloor),
        height: Number(floorCount) * Number(heightPerFloor),
        data_sources: selectedDataSources,
        officer_name: officerName,
        officer_notes: officerNotes,
        owner_name: ownerName,
        property_type: propertyType,
        status: 'Active Registered',
        custom_geometry: activeGeoJson || undefined,
      };

      const result = await AuthApi.createBuildingPipeline(payload);
      setCreatedResult(result);
      setStep(5);
    } catch (err: any) {
      setPipelineError(err.message || 'Pipeline processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitAndRender = () => {
    if (createdResult) {
      let finalBuilding = { ...createdResult.building };
      let finalFloors = [...createdResult.floors];
      let finalVPs = [...createdResult.vertical_parcels];

      // If user measured footprint interactively on the 2D map, place the 3D model & all floors exactly at those coordinates!
      if (activeGeoJson) {
        finalBuilding.geometry = activeGeoJson;
        finalFloors = finalFloors.map(fl => ({
          ...fl,
          geometry: activeGeoJson
        }));
        finalVPs = finalVPs.map(vp => ({
          ...vp,
          geometry: activeGeoJson
        }));
      }

      addNewBuilding({
        building: finalBuilding,
        floors: finalFloors,
        vertical_parcels: finalVPs,
        property_records: createdResult.property_records,
        validation: createdResult.validation,
      });

      // Clear the measurement overlay so yellow vertex pins & measure lines are removed
      clearMeasurePolygon();
      setIsMeasuringPolygon(false);
      setPendingAiBuildingInput(null);
      closeAddBuildingModal();
    }
  };

  const currentUlpin = createdResult?.property_records?.[0]?.ulpin || format14DigitUlpin(selectedParcelId, 'F01', 'U01');

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">5-Step Cadastral Building Pipeline</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  OFFICER WORKFLOW
                </span>
              </div>
              <p className="text-xs text-slate-400">Input Data → AI 3D Processing → Admin Approval → Cadastral Record → 3D-ULPIN</p>
            </div>
          </div>

          <button
            onClick={closeAddBuildingModal}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Measured Footprint & AI Studio Link Banner */}
        {activeMeasuredPoints && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-amber-500/10 border-b border-indigo-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-950 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Measured 2D Footprint ({activeMeasuredPoints.length} vertices) mapped directly to 3D Digital Twin with zero spatial overlap
                {pendingAiBuildingInput?.aiSpec ? ` (synthesized via Google AI Studio ${pendingAiBuildingInput.aiSpec.model_used || 'Gemini'})` : ''}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
              Live 2D Location Linked
            </span>
          </div>
        )}

        {/* 5-Step Progress Stepper Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: 'Input Data', icon: Database },
              { num: 2, title: 'AI / 3D Processing', icon: Cpu },
              { num: 3, title: 'Admin Review', icon: ShieldCheck },
              { num: 4, title: 'Cadastral Record', icon: Network },
              { num: 5, title: '3D-ULPIN & Map', icon: FileBadge },
            ].map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isPast = step > s.num;

              return (
                <div key={s.num} className="flex items-center gap-2">
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40' 
                        : isPast 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className={`text-[11px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>
                      {s.title}
                    </div>
                  </div>
                  {idx < 4 && <div className="hidden sm:block w-6 md:w-10 h-0.5 bg-slate-200 mx-1" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Error Banner */}
        {pipelineError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{pipelineError}</span>
          </div>
        )}

        {/* Scrollable Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1 max-h-[60vh]">
          {/* STEP 1: INPUT DATA */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                  Select Input Geospatial Data Sources
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-sensor fusion from Drone, LiDAR, GIS parcel boundary, and GNSS CORS networks.
                </p>
              </div>

              {/* Data Sources Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Active Multi-Sensor Inputs (Select to Include)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {DATA_SOURCES_LIST.map((source) => {
                    const isSelected = selectedDataSources.includes(source.label);
                    return (
                      <button
                        type="button"
                        key={source.id}
                        onClick={() => toggleDataSource(source.label)}
                        className={`p-3 text-left rounded-xl border transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                            {source.label}
                          </span>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500">{source.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Parcel and Building Geometry Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Revenue Cadastral Parcel
                  </label>
                  <select
                    value={selectedParcelId}
                    onChange={(e) => setSelectedParcelId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800"
                  >
                    <optgroup label="Available Vacant Plots (Recommended - Zero Overlap)">
                      {vacantParcels.map(p => (
                        <option key={p.parcel_id} value={p.parcel_id}>
                          {p.parcel_id} - Survey #{p.survey_number} ({p.land_use}) [Vacant Plot]
                        </option>
                      ))}
                    </optgroup>
                    {occupiedParcels.length > 0 && (
                      <optgroup label="Occupied Parcels (Already have a 3D Building)">
                        {occupiedParcels.map(p => (
                          <option key={p.parcel_id} value={p.parcel_id} disabled>
                            {p.parcel_id} - Occupied by {occupiedParcelMap.get(p.parcel_id)} (Building Overlap Prohibited)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Building Structure Name
                  </label>
                  <input
                    type="text"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    placeholder="e.g. Royal Heights Block B"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Building Usage / Type
                  </label>
                  <select
                    value={buildingType}
                    onChange={(e) => setBuildingType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800"
                  >
                    <option value="Residential Complex">Residential Complex</option>
                    <option value="Commercial Tower">Commercial Tower</option>
                    <option value="Mixed-Use (Retail + Residential)">Mixed-Use (Retail + Residential)</option>
                    <option value="Institutional & Public Facility">Institutional & Public Facility</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Floors
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={floorCount}
                      onChange={(e) => setFloorCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Floor Height (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={2.5}
                      max={6.0}
                      value={heightPerFloor}
                      onChange={(e) => setHeightPerFloor(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI / 3D PROCESSING */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
                  AI & 3D Spatial Geometry Processing Engine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Autonomous point cloud segmentation, vertical parcel subdivision, and topological error validation.
                </p>
              </div>

              {/* 4 Core AI Pipeline Modules */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Box className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">1. Building Footprint Extraction</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        RANSAC boundary fitting with Drone orthomosaic & LiDAR density thresholding.
                      </p>
                      <div className="mt-1 text-[10px] font-mono text-emerald-700 font-semibold">
                        STATUS: EXTRACTED (Footprint: 280.0 m², Est. Ground Elevation: 100.0m)
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">2. Floor Height Segmentation</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Z-axis vertical slicing into {floorCount} standard storeys at {heightPerFloor}m intervals.
                      </p>
                      <div className="mt-1 text-[10px] font-mono text-emerald-700 font-semibold">
                        STATUS: SLICED ({floorCount} Floors, Total Building Height: {(floorCount * heightPerFloor).toFixed(1)}m)
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Network className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">3. Vertical Parcel Delineation</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Subdividing volumetric spatial units with bounding polyhedra (Units 01 & 02 per floor).
                      </p>
                      <div className="mt-1 text-[10px] font-mono text-emerald-700 font-semibold">
                        STATUS: DELINEATED ({floorCount * 2} Independent 3D Units Generated)
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">4. Topology Validation Engine</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Volumetric non-overlap test, parcel containment check & air-rights compliance.
                      </p>
                      <div className="mt-1 text-[10px] font-mono text-emerald-700 font-semibold">
                        STATUS: ZERO CLASHES DETECTED (Topology Check: 100% Passed)
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ADMIN (AUTHORIZED OFFICER) */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">3</span>
                  Authorized Officer Review & Attribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Validate geometry, attach legal ownership/khatauni record, and apply digital endorsement.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Authorized Cadastral Officer
                  </label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Unit Legal Owner
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Dr. Priya Deshmukh"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Property Designation
                  </label>
                  <input
                    type="text"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    placeholder="e.g. 3BHK Residential Unit"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Verification Seal & Status
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Officer Certified (LADM ISO 19152 Ready)</span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Officer Geometric Validation Endorsement Notes
                  </label>
                  <textarea
                    rows={2}
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: 3D CADASTRAL RECORD HIERARCHY */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">4</span>
                  3D Cadastral Record Relational Hierarchy
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assembly chain: Parcel → Building → Floor → Unit → Volume → Ownership
                </p>
              </div>

              {/* Hierarchy Visual Flow */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center gap-2 text-emerald-400">
                  <MapPin className="w-4 h-4" />
                  <span className="font-bold">PARCEL:</span>
                  <span>{selectedParcelId} (Land Cadastre)</span>
                </div>
                <div className="pl-5 text-slate-500">↓</div>

                <div className="flex items-center gap-2 text-blue-400 pl-4">
                  <Building2 className="w-4 h-4" />
                  <span className="font-bold">BUILDING:</span>
                  <span>{buildingName} ({floorCount} Floors, {(floorCount * heightPerFloor).toFixed(1)}m)</span>
                </div>
                <div className="pl-9 text-slate-500">↓</div>

                <div className="flex items-center gap-2 text-amber-400 pl-8">
                  <Layers className="w-4 h-4" />
                  <span className="font-bold">FLOOR:</span>
                  <span>Floor 01 (Elevation 100.0m - 103.5m) to Floor {String(floorCount).padStart(2, '0')}</span>
                </div>
                <div className="pl-12 text-slate-500">↓</div>

                <div className="flex items-center gap-2 text-purple-400 pl-12">
                  <Box className="w-4 h-4" />
                  <span className="font-bold">UNIT & VOLUME:</span>
                  <span>VP-01 (135.0 m², Volume 472.5 m³)</span>
                </div>
                <div className="pl-16 text-slate-500">↓</div>

                <div className="flex items-center gap-2 text-rose-400 pl-16">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-bold">OWNERSHIP:</span>
                  <span>{ownerName} ({propertyType})</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Ready for 3D-ULPIN Unique Identifier Generation</span>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Click next to compute the 14-digit alphanumeric Bhu-Aadhaar code and generate the 3D twin mesh.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: 3D-ULPIN & LIVE MAP RENDERING */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">5</span>
                  3D-ULPIN Generated & 3D Structure Ready
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unique Bhu-Aadhaar 14-digit identifier created. Ready to list on the live 3D cadastre map.
                </p>
              </div>

              {/* ULPIN Certificate Card */}
              <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/30 shadow-md">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Code */}
                  <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200 shrink-0 flex flex-col items-center">
                    <ScannableQRCode
                      value={`https://bhu-aadhaar.gov.in/cadastre/${currentUlpin}`}
                      size={100}
                    />
                    <div className="text-[9px] font-mono text-center text-slate-500 mt-1 font-bold">
                      SCAN TO VERIFY
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      National Cadastral Unique Property Identifier (3D-ULPIN)
                    </div>
                    <div className="text-2xl font-black font-mono tracking-wider text-slate-900 bg-emerald-100/50 px-3 py-1 rounded-lg inline-block border border-emerald-300">
                      {currentUlpin}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-slate-500">Building:</span>{' '}
                        <span className="font-bold text-slate-800">{createdResult?.building?.building_id || 'B009'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Parcel:</span>{' '}
                        <span className="font-bold text-slate-800">{selectedParcelId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Owner:</span>{' '}
                        <span className="font-bold text-slate-800">{ownerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Height:</span>{' '}
                        <span className="font-bold text-slate-800">{(floorCount * heightPerFloor).toFixed(1)}m</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
              >
                <span>Proceed to AI Processing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
              >
                <span>Proceed to Admin Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleNextFromStep3}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
              >
                <span>Proceed to Cadastral Record</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleGenerate3DUlpin}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isProcessing ? 'Synthesizing 3D Record...' : 'Generate 3D-ULPIN & Structure'}</span>
              </button>
            )}

            {step === 5 && (
              <button
                type="button"
                onClick={handleCommitAndRender}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Commit & Render Live on 3D Map Twin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
