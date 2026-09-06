import React, { useEffect } from 'react';
import { useCadastralStore } from './state/useCadastralStore';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PropertyDetailsPanel } from './components/layout/PropertyDetailsPanel';
import { BottomControls } from './components/layout/BottomControls';
import { LeafletMap } from './map/LeafletMap';
import { Scene3D } from './three/Scene3D';
import { MeasureToolPanel } from './components/measurement/MeasureToolPanel';
import { ValidationResultsPanel } from './components/validation/ValidationResultsPanel';
import { DataImportModal } from './components/import/DataImportModal';
import { PropertyReportModal } from './components/report/PropertyReportModal';

export const App: React.FC = () => {
  const { viewMode, fetchAllData, isLoading, error } = useCadastralStore();

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090e] text-slate-100 overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <Header />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Control Sidebar */}
        <Sidebar />

        {/* Center 2D / 3D Geospatial Viewer Area */}
        <main className="flex-1 relative flex overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center font-mono text-cyan-400">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs tracking-wider uppercase">Loading 3D Cadastral Datasets...</p>
            </div>
          )}

          {error && (
            <div className="absolute top-4 left-4 z-40 bg-red-950/90 border border-red-500/50 text-red-200 text-xs px-3 py-2 rounded-lg font-mono">
              Error: {error}
            </div>
          )}

          {/* 2D View Mode */}
          {viewMode === '2d' && (
            <div className="w-full h-full">
              <LeafletMap />
            </div>
          )}

          {/* 3D View Mode */}
          {viewMode === '3d' && (
            <div className="w-full h-full">
              <Scene3D />
            </div>
          )}

          {/* Synchronized Split View Mode */}
          {viewMode === 'split' && (
            <div className="w-full h-full flex">
              <div className="w-1/2 h-full border-r border-sky-900/40 relative">
                <div className="absolute top-2 left-2 z-10 bg-slate-950/80 border border-slate-700/80 text-[10px] font-mono px-2 py-0.5 rounded text-sky-400 font-bold uppercase">
                  2D GIS Cadastre
                </div>
                <LeafletMap />
              </div>
              <div className="w-1/2 h-full relative">
                <div className="absolute top-2 left-2 z-10 bg-slate-950/80 border border-slate-700/80 text-[10px] font-mono px-2 py-0.5 rounded text-cyan-400 font-bold uppercase">
                  3D Extruded Meshes
                </div>
                <Scene3D />
              </div>
            </div>
          )}

          {/* Floating Measurement Tool Panel */}
          <MeasureToolPanel />
        </main>

        {/* Right Property & ULPIN Details Panel */}
        <PropertyDetailsPanel />
      </div>

      {/* Bottom Controls Bar */}
      <BottomControls />

      {/* Modals */}
      <ValidationResultsPanel />
      <DataImportModal />
      <PropertyReportModal />
    </div>
  );
};

export default App;
