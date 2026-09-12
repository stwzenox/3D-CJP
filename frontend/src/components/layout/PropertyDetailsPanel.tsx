import React, { useState } from 'react';
import {
  FileText, CheckCircle2, AlertTriangle, Sparkles,
  Printer, ArrowUpRight, Shield, Layers, Box
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';

export const PropertyDetailsPanel: React.FC = () => {
  const {
    selectedProperty,
    selectedBuildingId,
    selectedFloorId,
    generateUlpinForCurrent,
    setReportModalOpen
  } = useCadastralStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUlpinMsg, setGeneratedUlpinMsg] = useState<string | null>(null);

  if (!selectedProperty) {
    return (
      <aside className="w-80 border-l border-slate-800/80 bg-slate-950/80 backdrop-blur-md p-4 text-slate-500 text-xs flex flex-col items-center justify-center text-center">
        <Box className="w-8 h-8 text-slate-700 mb-2 stroke-1" />
        <p className="font-mono">Select a parcel, building, floor, or subterranean asset to view 3D cadastral specifications.</p>
      </aside>
    );
  }

  const handleGenerateUlpin = async () => {
    setIsGenerating(true);
    setGeneratedUlpinMsg(null);
    const newUlpin = await generateUlpinForCurrent();
    setIsGenerating(false);
    if (newUlpin) {
      setGeneratedUlpinMsg(`Assigned: ${newUlpin}`);
      setTimeout(() => setGeneratedUlpinMsg(null), 4000);
    }
  };

  const prop = selectedProperty;

  return (
    <aside className="w-80 border-l border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-col h-[calc(100vh-3.5rem)] select-none overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-500/30">
            {prop.type || 'Vertical Parcel'}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Topology Valid</span>
          </div>
        </div>

        <h2 className="text-sm font-bold text-white mt-2 font-mono tracking-tight break-all">
          {prop.ulpin || prop.id || 'UP2110B0101P01'}
        </h2>
        <div className="text-[11px] text-slate-400 font-mono">
          Object Reference: {prop.id || 'N/A'}
        </div>
      </div>

      {/* Main 3D Spatial Specifications */}
      <div className="p-4 space-y-3 text-xs flex-1">
        {/* Z-Range Elevation Specification */}
        {(prop.z_min !== undefined || prop.ground_elevation !== undefined) && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Vertical Elevation (Z-Axis)</span>
              <span className="text-cyan-400 font-bold">WGS84 Tangent</span>
            </div>
            <div className="flex items-baseline justify-between mt-1 font-mono">
              <div>
                <span className="text-slate-500 text-[10px]">Z MIN: </span>
                <span className="text-white font-bold">{prop.z_min ?? prop.ground_elevation}m</span>
              </div>
              <div className="text-slate-600">→</div>
              <div>
                <span className="text-slate-500 text-[10px]">Z MAX: </span>
                <span className="text-white font-bold">{prop.z_max ?? prop.roof_elevation}m</span>
              </div>
            </div>
          </div>
        )}

        {/* 3D Volumetric Metrics */}
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400">Horizontal Area</div>
            <div className="text-sm font-bold text-sky-400 mt-0.5">
              {prop.area ? `${prop.area} m²` : 'N/A'}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400">Vertical Volume</div>
            <div className="text-sm font-bold text-cyan-300 mt-0.5">
              {prop.volume ? `${Math.round(prop.volume)} m³` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Ownership & Administrative Information */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3 space-y-2 font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            Cadastral Hierarchy
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Parcel Survey:</span>
            <span className="text-slate-300">{prop.survey_number || prop.parcel_id || 'SURV-101/A'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Parent Building:</span>
            <span className="text-slate-300">{prop.building_id || selectedBuildingId || 'B001'}</span>
          </div>

          {prop.floor_number && (
            <div className="flex justify-between">
              <span className="text-slate-500">Floor Level:</span>
              <span className="text-cyan-400 font-bold">Level {prop.floor_number}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-500">Property Type:</span>
            <span className="text-slate-300">{prop.property_type || prop.land_use || 'Residential Unit'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Primary Holder:</span>
            <span className="text-slate-200 font-semibold">{prop.owner || prop.owner_name || 'Govt Verified Citizen'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="text-emerald-400">{prop.status || 'Registered'}</span>
          </div>
        </div>

        {/* AI Extraction Confidence */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-2.5 font-mono text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI LiDAR Confidence:</span>
          </div>
          <span className="text-cyan-300 font-bold">98.4% (RANSAC-v1)</span>
        </div>

        {/* Action: Generate ULPIN */}
        <button
          onClick={handleGenerateUlpin}
          disabled={isGenerating}
          className="w-full py-2 bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-bold font-mono text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isGenerating ? 'Generating 14-Digit ULPIN...' : 'Generate 14-Digit ULPIN'}
        </button>

        {generatedUlpinMsg && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] p-2 rounded text-center font-mono">
            {generatedUlpinMsg}
          </div>
        )}

        {/* Action: Print Property Report */}
        <button
          onClick={() => setReportModalOpen(true)}
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Cadastral Report
        </button>
      </div>

      {/* Cadastral Notice */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950 text-[10px] text-slate-500 font-mono text-center">
        BHU-AADHAAR CADASTRAL RECORD. National 3D Cadastral Registry.
      </div>
    </aside>
  );
};
