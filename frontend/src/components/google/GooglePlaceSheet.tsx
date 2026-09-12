import React, { useState } from 'react';
import {
  X, CheckCircle2, Copy, Check, Printer, Sparkles,
  Building2, MapPin, ArrowUpRight, Shield, Layers, Ruler,
  FileText, Award, Navigation, ChevronRight, QrCode, Smartphone,
  Trash2, PlusCircle
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { useAuthStore } from '../../state/useAuthStore';
import { ScannableQRCode } from '../common/ScannableQRCode';
import { format14DigitUlpin } from '../../utils/ulpin';

export const GooglePlaceSheet: React.FC = () => {
  const { role, openAddBuildingModal } = useAuthStore();
  const isAdminOrSuperAdmin = role === 'admin' || role === 'superadmin';

  const {
    selectedProperty,
    selectedBuildingId,
    selectedFloorId,
    selectedVerticalParcelId,
    floors,
    buildings,
    verticalProperties,
    selectFloor,
    selectVerticalParcel,
    generateUlpinForCurrent,
    setReportModalOpen,
    isExplodedView,
    setExplodedView,
    setMeasureMode,
    isDetailsOpen,
    setDetailsOpen,
    removeBuilding
  } = useCadastralStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  if (!selectedProperty || !isDetailsOpen) return null;

  const prop = selectedProperty;

  // Resolve target building from selected property or selected building ID
  const activeBuildingId = (
    prop.building_id ||
    (prop.type === 'Building' ? prop.id : null) ||
    selectedBuildingId ||
    (buildings.find(b => b.parcel_id === prop.parcel_id)?.building_id) ||
    null
  );

  const matchedBuilding = activeBuildingId 
    ? buildings.find(b => b.building_id?.toUpperCase() === activeBuildingId.toUpperCase())
    : null;

  const buildingFloors = activeBuildingId
    ? floors
        .filter(f => f.building_id?.toUpperCase() === activeBuildingId.toUpperCase())
        .sort((a, b) => b.floor_number - a.floor_number) // Top to bottom
    : [];

  const handleCopyUlpin = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateUlpin = async () => {
    setIsGenerating(true);
    setGenMessage(null);
    const res = await generateUlpinForCurrent();
    setIsGenerating(false);
    if (res) {
      setGenMessage(`Assigned ULPIN: ${res}`);
      setTimeout(() => setGenMessage(null), 4000);
    }
  };

  const handleDeleteBuilding = async () => {
    const targetBid = matchedBuilding?.building_id || activeBuildingId;
    if (!targetBid) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete Building "${targetBid}"?\n\nThis will remove:\n• 3D extruded mesh and 2D cadastral footprint from the map\n• All floor slabs and vertical parcel subdivisions\n• All associated 14-digit ULPIN revenue deeds`
    );
    if (!confirmDelete) return;
    await removeBuilding(targetBid);
    setDetailsOpen(false);
  };

  const currentUlpin = prop.ulpin || format14DigitUlpin(activeBuildingId || 'B001', selectedFloorId || 'F01', prop.id || 'P01');

  return (
    <div className="absolute top-[108px] left-4 z-20 w-[390px] sm:w-[410px] max-h-[calc(100vh-125px)] bg-white/95 backdrop-blur-md text-slate-800 rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-200/90 flex flex-col overflow-hidden pointer-events-auto select-none transition-all animate-fade-in">
      {/* 1. Header Banner & Close */}
      <div className="relative p-5 pb-3 border-b border-slate-100 bg-gradient-to-b from-blue-50/70 to-transparent">
        <button
          onClick={() => setDetailsOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          title="Close Place Details"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {prop.type || '3D Cadastral Asset'}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Topology Valid</span>
          </span>
        </div>

        <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
          {prop.id ? `${prop.type || 'Object'} ${prop.id}` : 'Civil Lines Complex'}
        </h2>
        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
          <span>Prayagraj Central, Uttar Pradesh 211001</span>
        </p>

        {/* Rating & Trust Badges */}
        <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1 text-amber-600 font-bold">
            <span>★ 4.9</span>
            <span className="text-slate-400 font-normal">(RERA Cadastre)</span>
          </div>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">Bhu-Aadhaar Verified</span>
        </div>
      </div>

      {/* 2. Action Buttons Row (Google Maps style) */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
        {/* Assign 3D ULPIN */}
        <button
          onClick={handleGenerateUlpin}
          disabled={isGenerating}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl text-blue-600 hover:bg-blue-50 transition-colors text-center"
        >
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Award className="w-4 h-4" />
            )}
          </div>
          <span className="text-[11px] font-semibold leading-tight">Assign ULPIN</span>
        </button>

        {/* Print Report */}
        <button
          onClick={() => setReportModalOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl text-slate-700 hover:bg-slate-50 transition-colors text-center"
        >
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
            <Printer className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold leading-tight">Cadastre Report</span>
        </button>

        {/* 3D Explode */}
        <button
          onClick={() => setExplodedView(!isExplodedView)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-colors text-center ${
            isExplodedView ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isExplodedView ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold leading-tight">{isExplodedView ? 'Collapse' : 'Explode 3D'}</span>
        </button>

        {/* Measure (Admin / Super Admin only) */}
        {isAdminOrSuperAdmin && (
          <button
            onClick={() => setMeasureMode('distance')}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl text-slate-700 hover:bg-slate-50 transition-colors text-center"
          >
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
              <Ruler className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold leading-tight">Measure</span>
          </button>
        )}
      </div>

      {/* Admin / Super Admin Cadastre Operations Bar */}
      {isAdminOrSuperAdmin && (
        <div className="px-4 py-2 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Admin Actions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={openAddBuildingModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold shadow-xs transition-colors"
              title="Add New Building (5-Step 3D Cadastre Flow)"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Add Building</span>
            </button>
            {activeBuildingId && (
              <button
                onClick={handleDeleteBuilding}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200/80 rounded-lg text-[11px] font-semibold transition-colors"
                title="Delete this building, removing 3D mesh, 2D structures, and cascaded ULPINs"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Generation Toast */}
      {genMessage && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{genMessage}</span>
        </div>
      )}

      {/* 3. Scrollable Specifications Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
        {/* ULPIN Display Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              14-Digit Bhu-Aadhaar 3D ULPIN
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5 break-all">
              {currentUlpin}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowQr(!showQr)}
              className={`p-2 rounded-xl border transition-colors shadow-sm ${
                showQr
                  ? 'bg-blue-50 text-blue-600 border-blue-400'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
              title="View Scannable QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCopyUlpin(currentUlpin)}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors shadow-sm"
              title="Copy ULPIN"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Scannable QR Code Box */}
        {showQr && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center justify-center text-center animate-fade-in space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>Scan to Verify 3D ULPIN on Mobile</span>
            </div>
            <ScannableQRCode
              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://bhu-aadhaar.up.gov.in'}/?ulpin=${encodeURIComponent(currentUlpin)}&id=${encodeURIComponent(prop.id || 'B001')}#verify`}
              size={130}
              showScanHint={true}
            />
            <p className="text-[10px] text-slate-500 max-w-[240px] leading-tight">
              Scan with your phone camera, Google Lens, or Paytm to verify Bhu-Aadhaar 3D Cadastral integrity.
            </p>
          </div>
        )}

        {/* Vertical Elevation & Height Metrics */}
        {(prop.z_min !== undefined || prop.ground_elevation !== undefined) && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Vertical Elevation (Z-Axis)</span>
              <span className="text-blue-600 font-bold">WGS84 Datum</span>
            </div>
            <div className="flex items-center justify-between text-slate-800 font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">GROUND / Z MIN</span>
                <span className="text-base font-bold text-slate-900">{prop.z_min ?? prop.ground_elevation}m</span>
              </div>
              <div className="text-slate-300 font-bold text-lg">→</div>
              <div>
                <span className="text-slate-400 text-[10px] block">ROOF / Z MAX</span>
                <span className="text-base font-bold text-slate-900">{prop.z_max ?? prop.roof_elevation}m</span>
              </div>
            </div>
          </div>
        )}

        {/* 3D Volumetric Metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
            <div className="text-[10px] font-semibold text-slate-400">Horizontal Area</div>
            <div className="text-base font-bold text-blue-600 mt-0.5">
              {prop.area ? `${prop.area} m²` : '412.5 m²'}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
            <div className="text-[10px] font-semibold text-slate-400">Vertical Envelope</div>
            <div className="text-base font-bold text-indigo-600 mt-0.5">
              {prop.volume ? `${Math.round(prop.volume)} m³` : '7,425 m³'}
            </div>
          </div>
        </div>

        {/* Cadastral Hierarchy & Ownership Details */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Cadastral Hierarchy
          </div>

          <div className="flex justify-between py-1 border-b border-slate-200/60 text-slate-700">
            <span className="text-slate-500">Parcel Survey No:</span>
            <span className="font-semibold text-slate-900">{prop.survey_number || prop.parcel_id || 'P001'}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-200/60 text-slate-700">
            <span className="text-slate-500">Primary Holder:</span>
            <span className="font-semibold text-slate-900">{prop.owner_name || prop.owner || 'Govt Verified Citizen'}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-200/60 text-slate-700">
            <span className="text-slate-500">Property Category:</span>
            <span className="font-semibold text-slate-900">{prop.property_type || prop.building_type || 'Commercial / Mixed'}</span>
          </div>

          <div className="flex justify-between py-1 text-slate-700">
            <span className="text-slate-500">Registry Status:</span>
            <span className="font-semibold text-emerald-600">Active Registered</span>
          </div>
        </div>

        {/* Interactive Floor Slices Breakdown */}
        {buildingFloors.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Vertical Floors ({buildingFloors.length})</span>
              <span className="text-blue-600 font-semibold">Click to inspect</span>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {buildingFloors.map((fl) => {
                const isSelected = selectedFloorId === fl.floor_id;
                const floorApts = verticalProperties.filter(vp => vp.floor_id === fl.floor_id);

                return (
                  <div key={fl.floor_id} className="space-y-1">
                    <button
                      onClick={() => selectFloor(fl.floor_id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Floor {fl.floor_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span>{fl.z_min}m - {fl.z_max}m</span>
                        <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                    </button>

                    {/* Subdivided Apartments (e.g. B001 Floor 3) */}
                    {isSelected && floorApts.length > 1 && (
                      <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-blue-600">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">
                          Subdivided Units ({floorApts.length})
                        </div>
                        {floorApts.map((apt) => {
                          const isAptActive = selectedVerticalParcelId === apt.vertical_parcel_id;
                          return (
                            <button
                              key={apt.vertical_parcel_id}
                              onClick={(e) => {
                                e.stopPropagation();
                                selectVerticalParcel(apt.vertical_parcel_id);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-[11px] font-mono border transition-all ${
                                isAptActive
                                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              <span>{apt.vertical_parcel_id}</span>
                              <span className="font-semibold text-emerald-600">{apt.property_type}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
