import React, { useState } from 'react';
import {
  Compass, Plus, Minus, Navigation2, Crosshair,
  Sliders, ArrowDownUp, RotateCcw, ChevronUp, ChevronDown
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { ORIGIN_LAT, ORIGIN_LNG } from '../../utils/coordinates';

export const GoogleMapControls: React.FC = () => {
  const {
    cameraPreset,
    setCameraPreset,
    zMinClip,
    zMaxClip,
    setZClip,
    viewMode,
    setViewMode,
    selectBuilding
  } = useCadastralStore();

  const [isZClipOpen, setIsZClipOpen] = useState(false);

  const handleCenterMap = () => {
    selectBuilding('B001');
    setCameraPreset('default');
  };

  const handleToggle3D = () => {
    if (cameraPreset === 'top') {
      setCameraPreset('default');
    } else {
      setCameraPreset('top');
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-2 pointer-events-auto select-none">
      {/* 1. Z-Clipping Slider Floating Pill */}
      <div className="flex flex-col items-end">
        {isZClipOpen ? (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 w-64 space-y-2 mb-2 animate-fade-in text-xs">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span className="flex items-center gap-1 text-blue-600">
                <ArrowDownUp className="w-3.5 h-3.5" />
                <span>Z-Axis Vertical Clip</span>
              </span>
              <button
                onClick={() => setIsZClipOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Min Elevation Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Z MIN:</span>
                <span className="font-bold text-slate-900">{zMinClip}m</span>
              </div>
              <input
                type="range"
                min="80"
                max="125"
                step="1"
                value={zMinClip}
                onChange={(e) => setZClip(parseInt(e.target.value), Math.max(zMaxClip, parseInt(e.target.value) + 2))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded cursor-pointer"
              />
            </div>

            {/* Max Elevation Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Z MAX:</span>
                <span className="font-bold text-slate-900">{zMaxClip}m</span>
              </div>
              <input
                type="range"
                min="95"
                max="150"
                step="1"
                value={zMaxClip}
                onChange={(e) => setZClip(Math.min(zMinClip, parseInt(e.target.value) - 2), parseInt(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded cursor-pointer"
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsZClipOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-all mb-1"
            title="Adjust Z-Axis Clipping Range"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono text-[11px]">Z: {zMinClip}m - {zMaxClip}m</span>
          </button>
        )}
      </div>

      {/* 2. Camera Angle Quick Chips */}
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 p-1 mb-1">
        {[
          { key: 'default', label: '3D' },
          { key: 'top', label: '2D Top' },
          { key: 'side', label: 'Side' },
          { key: 'isometric', label: 'Iso' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCameraPreset(key as any)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-xl transition-all ${
              cameraPreset === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 3. Google Maps Vertical Control Stack */}
      <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {/* Reset North Compass */}
        <button
          onClick={() => setCameraPreset('top')}
          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
          title="Reset to North"
        >
          <Compass className="w-5 h-5" />
        </button>

        {/* 3D / 2D Tilt Toggle */}
        <button
          onClick={handleToggle3D}
          className="w-10 h-10 flex items-center justify-center font-bold text-xs text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
          title={cameraPreset === 'top' ? 'Switch to 3D Perspective' : 'Switch to 2D Top-Down'}
        >
          {cameraPreset === 'top' ? '2D' : '3D'}
        </button>

        {/* Center on Prayagraj */}
        <button
          onClick={handleCenterMap}
          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
          title="Center on Prayagraj Cadastre"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Google Maps Style Coordinate & Datum Badge */}
      <div className="px-2.5 py-1 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 text-[10px] font-mono text-slate-500 shadow-sm">
        Prayagraj {ORIGIN_LAT}°N, {ORIGIN_LNG}°E • WGS84
      </div>
    </div>
  );
};
