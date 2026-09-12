import React, { useState } from 'react';
import {
  Layers, Map, Box, Split, Search, ShieldCheck, Upload,
  Ruler, RefreshCw, Radio
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';

export const Header: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    searchGlobal,
    runValidationCheck,
    setImportModalOpen,
    measureMode,
    setMeasureMode,
    fetchAllData,
    isLiveBackend
  } = useCadastralStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchFeedback(null);
    const found = await searchGlobal(searchQuery);
    setIsSearching(false);

    if (!found) {
      setSearchFeedback('Not found');
      setTimeout(() => setSearchFeedback(null), 2500);
    }
  };

  return (
    <header className="h-14 border-b border-sky-900/40 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Context */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-tr from-sky-500 to-cyan-300 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Layers className="w-5 h-5 text-slate-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">
              3D ULPIN & VPMS
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
              SIH 2026 PS-11
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Vertical Cadastre & Subsurface Mapping Prototype
          </p>
        </div>
      </div>

      {/* View Switcher Controls */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
        <button
          onClick={() => setViewMode('2d')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${
            viewMode === '2d'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          2D Map
        </button>

        <button
          onClick={() => setViewMode('3d')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${
            viewMode === '3d'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          3D Cadastre
        </button>

        <button
          onClick={() => setViewMode('split')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${
            viewMode === 'split'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          Split View
        </button>
      </div>

      {/* Global ULPIN / Cadastre Search */}
      <form onSubmit={handleSearch} className="relative w-80">
        <div className="relative">
          <input
            type="text"
            placeholder="Search ULPIN, Building, Floor or Parcel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-cyan-400 text-xs text-white rounded-lg pl-8 pr-16 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 font-mono placeholder:text-slate-500 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1 top-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded border border-slate-600 transition-colors"
          >
            {isSearching ? '...' : 'Find'}
          </button>
        </div>
        {searchFeedback && (
          <div className="absolute top-10 right-0 bg-red-950/90 border border-red-500/50 text-red-300 text-[11px] px-2 py-1 rounded shadow-lg">
            {searchFeedback}
          </div>
        )}
      </form>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => runValidationCheck()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all shadow-sm"
          title="Run Cadastral Topology Validation"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Topology</span>
        </button>

        <button
          onClick={() => setImportModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded-lg transition-all shadow-sm"
          title="Import GeoJSON / CSV Data"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">Import</span>
        </button>

        <button
          onClick={() => setMeasureMode(measureMode === 'none' ? 'distance' : 'none')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
            measureMode !== 'none'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Toggle Measurement Tool"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Measure</span>
        </button>

        <button
          onClick={() => fetchAllData()}
          className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all"
          title="Refresh Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Live FastAPI / Cloud Standalone Status Pill */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-[10px] font-mono shadow-sm"
          title={isLiveBackend ? "Connected to live FastAPI backend on port 8000" : "Running with embedded Prayagraj 3D cadastre dataset for Vercel/Cloud preview"}
        >
          <span className={`w-2 h-2 rounded-full ${isLiveBackend ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`}></span>
          <span className={isLiveBackend ? 'text-emerald-400 font-semibold' : 'text-cyan-400 font-medium'}>
            {isLiveBackend ? 'FastAPI Live' : 'Cloud Synchronized'}
          </span>
        </div>
      </div>
    </header>
  );
};
