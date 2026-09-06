import React from 'react';
import { Printer, X, ShieldCheck, QrCode, FileText } from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { ORIGIN_LAT, ORIGIN_LNG } from '../../utils/coordinates';

export const PropertyReportModal: React.FC = () => {
  const { isReportModalOpen, setReportModalOpen, selectedProperty } = useCadastralStore();

  if (!isReportModalOpen) return null;

  const prop = selectedProperty || {
    id: 'PROP-00101',
    ulpin: 'IN-UP-DEMO-B001-F03-APTA',
    type: 'Vertical Parcel',
    building_id: 'B001',
    floor_id: 'B001-F03',
    parcel_id: 'P001',
    survey_number: 'SURV-101/A',
    floor_number: 3,
    z_min: 106.0,
    z_max: 109.0,
    area: 120.5,
    volume: 361.5,
    owner: 'Aditya Verma',
    status: 'Verified Demo Data',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div className="bg-slate-900 print:bg-white text-slate-100 print:text-slate-900 border border-slate-700 print:border-none rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col font-mono max-h-[90vh]">
        {/* Actions Bar (hidden in print) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-2 text-cyan-400">
            <FileText className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Cadastral Property Certificate Preview
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={() => setReportModalOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Content */}
        <div className="p-8 overflow-y-auto space-y-6 print:p-6">
          {/* Certificate Header */}
          <div className="border-b-2 border-slate-700 print:border-slate-800 pb-4 text-center">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 print:text-slate-600 font-bold">
              Government of Uttar Pradesh • Revenue & Cadastral Mapping Department
            </div>
            <h1 className="text-lg font-bold text-cyan-400 print:text-blue-900 uppercase tracking-tight mt-1">
              3D Vertical Property Cadastral Certificate
            </h1>
            <div className="text-[10px] text-slate-500 print:text-slate-600 mt-0.5">
              Unique Land Parcel Identification Number (ULPIN) Verification Record
            </div>
          </div>

          {/* ULPIN & QR Section */}
          <div className="bg-slate-950/60 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 print:text-slate-600 uppercase tracking-wider">
                Assigned 3D ULPIN Code
              </div>
              <div className="text-base font-bold text-sky-400 print:text-blue-800 mt-0.5 break-all">
                {prop.ulpin || 'IN-UP-DEMO-B001-F03-APTA'}
              </div>
              <div className="text-[11px] text-slate-400 print:text-slate-600 mt-1">
                Property ID: <span className="text-white print:text-black font-semibold">{prop.id}</span>
              </div>
            </div>

            <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center shadow">
              <QrCode className="w-14 h-14 text-slate-900" />
            </div>
          </div>

          {/* Spatial Attributes Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-2">
              Spatial & Volumetric Metrics
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-950/40 print:bg-slate-50 rounded border border-slate-800 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-500 text-[10px] block">Vertical Bounds (Z):</span>
                <span className="font-bold text-white print:text-black">
                  {prop.z_min ?? 106.0}m to {prop.z_max ?? 109.0}m MSL
                </span>
              </div>

              <div className="p-2.5 bg-slate-950/40 print:bg-slate-50 rounded border border-slate-800 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-500 text-[10px] block">Calculated Volume:</span>
                <span className="font-bold text-cyan-300 print:text-blue-800">
                  {prop.volume ? `${Math.round(prop.volume)} m³` : '361 m³'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-950/40 print:bg-slate-50 rounded border border-slate-800 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-500 text-[10px] block">Floor Area:</span>
                <span className="font-bold text-white print:text-black">
                  {prop.area ? `${prop.area} m²` : '120.5 m²'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-950/40 print:bg-slate-50 rounded border border-slate-800 print:border-slate-300">
                <span className="text-slate-400 print:text-slate-500 text-[10px] block">Coordinate Tangent:</span>
                <span className="font-bold text-white print:text-black">
                  {ORIGIN_LAT}°N, {ORIGIN_LNG}°E
                </span>
              </div>
            </div>
          </div>

          {/* Cadastral Parent Hierarchy */}
          <div className="border border-slate-800 print:border-slate-300 rounded-lg p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-slate-600">Land Parcel ID:</span>
              <span className="font-semibold text-white print:text-black">{prop.parcel_id || 'P001'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-slate-600">Survey Number:</span>
              <span className="font-semibold text-white print:text-black">{prop.survey_number || 'SURV-101/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-slate-600">Building Reference:</span>
              <span className="font-semibold text-white print:text-black">{prop.building_id || 'B001'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-slate-600">Primary Registered Holder:</span>
              <span className="font-semibold text-cyan-300 print:text-blue-900">{prop.owner || 'Govt Verified Citizen'}</span>
            </div>
          </div>

          {/* Validation Stamp */}
          <div className="flex items-center justify-between border-t border-slate-800 print:border-slate-300 pt-4 text-[10px] text-slate-400 print:text-slate-600">
            <div className="flex items-center gap-1.5 text-emerald-400 print:text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>3D Topology Validated (Shapely Planar & Vertical Consistency)</span>
            </div>
            <div>Date: {new Date().toLocaleDateString()}</div>
          </div>

          {/* Official Disclaimer */}
          <div className="text-center text-[9px] text-slate-500 print:text-slate-600 border border-slate-800 print:border-slate-400 p-2 rounded">
            DEMO DATA — NOT OFFICIAL CADASTRAL DATA. Prototype for Smart India Hackathon 2026 Problem Statement 11. Does not constitute legal determination of land ownership.
          </div>
        </div>
      </div>
    </div>
  );
};
