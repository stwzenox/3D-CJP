import React, { useEffect } from 'react';
import { useCadastralStore } from './state/useCadastralStore';
import { GoogleSearchBar } from './components/google/GoogleSearchBar';
import { GoogleTopBar } from './components/google/GoogleTopBar';
import { GooglePlaceSheet } from './components/google/GooglePlaceSheet';
import { GoogleLayersMenu } from './components/google/GoogleLayersMenu';
import { GoogleMapControls } from './components/google/GoogleMapControls';
import { LeafletMap } from './map/LeafletMap';
import { Scene3D } from './three/Scene3D';
import { MeasureToolPanel } from './components/measurement/MeasureToolPanel';
import { ValidationResultsPanel } from './components/validation/ValidationResultsPanel';
import { DataImportModal } from './components/import/DataImportModal';
import { PropertyReportModal } from './components/report/PropertyReportModal';

export const App: React.FC = () => {
  const { viewMode, fetchAllData, isLoading, error, mapTheme } = useCadastralStore();
  const isLight = mapTheme === 'light';

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <div className={`relative w-screen h-screen overflow-hidden select-none font-sans ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#07090e] text-slate-100'}`}>
      {/* 1. Full-Bleed Map & 3D Geospatial Canvas (Edge-to-Edge) */}
      <main className="absolute inset-0 w-full h-full z-0 overflow-hidden">
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
            {/* Left 2D GIS Cadastre Pane */}
            <div className="w-1/2 h-full relative border-r border-slate-300 dark:border-slate-800">
              <div className="absolute top-20 left-4 z-10 bg-white/90 dark:bg-slate-900/90 shadow-md backdrop-blur-md border border-slate-200 dark:border-slate-800 text-[11px] font-semibold px-3 py-1 rounded-full text-blue-700 dark:text-blue-400 flex items-center gap-1.5 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>2D Cadastre</span>
              </div>
              <LeafletMap />
            </div>

            {/* Right 3D Digital Twin Pane */}
            <div className="w-1/2 h-full relative">
              <div className="absolute top-20 left-4 z-10 bg-white/90 dark:bg-slate-900/90 shadow-md backdrop-blur-md border border-slate-200 dark:border-slate-800 text-[11px] font-semibold px-3 py-1 rounded-full text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>3D Digital Twin</span>
              </div>
              <Scene3D />
            </div>
          </div>
        )}
      </main>

      {/* 2. Floating Google Maps Search Bar & Quick Category Chips (Top-Left) */}
      <GoogleSearchBar />

      {/* 3. Floating View Switcher & Action Pills (Top-Right) */}
      <GoogleTopBar />

      {/* 4. Floating Google Maps Place Details Card (Left Side Drawer) */}
      <GooglePlaceSheet />

      {/* 5. Floating Google Maps "Layers" Button & Menu (Bottom-Left) */}
      <GoogleLayersMenu />

      {/* 6. Floating Navigation, Zoom & Camera Controls (Bottom-Right) */}
      <GoogleMapControls />

      {/* 7. Floating Measurement Tool Panel */}
      <MeasureToolPanel />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-800 dark:text-slate-200">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3 shadow-lg shadow-blue-600/20" />
          <p className="text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-400">Loading 3D Cadastral Engine...</p>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-2xl shadow-xl shadow-red-600/25">
          {error}
        </div>
      )}

      {/* Dialog Modals */}
      <ValidationResultsPanel />
      <DataImportModal />
      <PropertyReportModal />
    </div>
  );
};

export default App;
