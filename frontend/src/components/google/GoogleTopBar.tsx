import React from 'react';
import {
  Map, Box, Split, ShieldCheck, Upload, Ruler, RefreshCw, Sun, Moon
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';

export const GoogleTopBar: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    mapTheme,
    setMapTheme,
    runValidationCheck,
    setImportModalOpen,
    measureMode,
    setMeasureMode,
    fetchAllData,
    isLiveBackend
  } = useCadastralStore();

  return (
    <div className="absolute top-4 right-4 z-30 flex items-center gap-2 pointer-events-auto select-none">
      {/* 1. View Mode Segmented Control (Google Maps Pill) */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-1 flex items-center gap-1">
        <button
          onClick={() => setViewMode('2d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-semibold transition-all ${
            viewMode === '2d'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="2D Standard GIS Cadastre"
        >
          <Map className="w-3.5 h-3.5" />
          <span>2D Map</span>
        </button>

        <button
          onClick={() => setViewMode('3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-semibold transition-all ${
            viewMode === '3d'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="3D Vertical Cadastre & Digital Twin"
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Cadastre</span>
        </button>

        <button
          onClick={() => setViewMode('split')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-semibold transition-all ${
            viewMode === 'split'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Synchronized Split View"
        >
          <Split className="w-3.5 h-3.5" />
          <span>Split View</span>
        </button>
      </div>

      {/* 2. Utility Actions (Topology, Import, Measure) */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-1 flex items-center gap-1">
        {/* Topology Validation */}
        <button
          onClick={() => runValidationCheck()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
          title="Run Cadastral Topology Validation"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden xl:inline">Topology</span>
        </button>

        {/* Data Import */}
        <button
          onClick={() => setImportModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          title="Import GeoJSON or DEM CSV"
        >
          <Upload className="w-4 h-4 text-blue-600" />
          <span className="hidden xl:inline">Import</span>
        </button>

        {/* Measurement Tool */}
        <button
          onClick={() => setMeasureMode(measureMode === 'none' ? 'distance' : 'none')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
            measureMode !== 'none'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Measure 3D Distance or Height"
        >
          <Ruler className="w-4 h-4 text-amber-600" />
          <span className="hidden xl:inline">Measure</span>
        </button>

        {/* Theme Toggle (Clean Google Street Map vs Dark) */}
        <button
          onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : 'light')}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          title={mapTheme === 'light' ? 'Switch to Dark Theme' : 'Switch to Clean Street Map'}
        >
          {mapTheme === 'light' ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={() => fetchAllData()}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all"
          title="Refresh Cadastral Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Server Status Pill */}
      <div
        className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 text-[11px] font-sans font-semibold"
        title={isLiveBackend ? 'Connected to local FastAPI backend on port 8000' : 'Running standalone Prayagraj demo dataset'}
      >
        <span className={`w-2 h-2 rounded-full ${isLiveBackend ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
        <span className={isLiveBackend ? 'text-emerald-700' : 'text-blue-700'}>
          {isLiveBackend ? 'FastAPI Live' : 'Demo Mode'}
        </span>
      </div>
    </div>
  );
};
