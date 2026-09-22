import React, { useState } from 'react';
import {
  Video,
  Eye,
  EyeOff,
  Pause,
  Play,
  Crop,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Maximize2,
  ShieldCheck,
  Check,
  Flag,
  UserCheck,
  Save,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { LiveDetection, NavigationTab } from '../types';
import { LIVE_DETECTIONS } from '../data/mockData';

interface LiveCaptureViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onShowToast: (msg: string, icon?: string) => void;
  selectedStudentId?: string | null;
}

export const LiveCaptureView: React.FC<LiveCaptureViewProps> = ({
  onNavigate,
  onShowToast,
  selectedStudentId
}) => {
  const [activeCam, setActiveCam] = useState('Overhead PTZ Cam 01 (4K)');
  const [privacyMask, setPrivacyMask] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.4);
  const [preset, setPreset] = useState('Preset 1 (Front Rows)');

  // Selected detection for telemetry inspector
  const initialSelected =
    LIVE_DETECTIONS.find((d) => d.studentId === selectedStudentId) || LIVE_DETECTIONS[0];
  const [selectedDetection, setSelectedDetection] = useState<LiveDetection>(initialSelected);

  // Dynamic overrides
  const [overrideStatus, setOverrideStatus] = useState<Record<string, 'CONFIRMED' | 'FLAGGED'>>({});

  const currentStatus = overrideStatus[selectedDetection.id] || selectedDetection.status;

  const handleConfirmPresence = () => {
    setOverrideStatus((prev) => ({ ...prev, [selectedDetection.id]: 'CONFIRMED' }));
    onShowToast(`Verified & marked attendance for ${selectedDetection.name}`, 'check');
  };

  const handleSendToReview = () => {
    setOverrideStatus((prev) => ({ ...prev, [selectedDetection.id]: 'FLAGGED' }));
    onShowToast(`Sent ${selectedDetection.name} to human Review Queue`, 'flag');
  };

  const handleEndSession = () => {
    onShowToast('Attendance session finalized. 86 students recorded, cryptographic hash pushed to SIS.');
    setTimeout(() => {
      onNavigate('dashboard');
    }, 1500);
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Top Session Header & Camera Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[12px] text-[#565d79]">
            <span className="font-semibold text-[#4f46e5] uppercase tracking-wider">
              CS402: Advanced Neural Networks
            </span>
            <span>•</span>
            <span>Turing Hall A2</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-[24px] font-bold text-[#0b1c30]">Live Inference Feed</h1>
            {/* Camera Switcher Dropdown */}
            <div className="relative inline-block">
              <select
                value={activeCam}
                onChange={(e) => {
                  setActiveCam(e.target.value);
                  onShowToast(`Switched stream to ${e.target.value}`);
                }}
                aria-label="Select Camera Stream"
                className="bg-white border border-[#dce9ff] text-[#0b1c30] text-[13px] font-semibold rounded-lg px-3 py-1.5 pr-8 shadow-xs cursor-pointer focus:outline-none focus:border-[#4f46e5]"
              >
                <option value="Overhead PTZ Cam 01 (4K)">Overhead PTZ Cam 01 (4K)</option>
                <option value="Auditorium B Cam 02 (1080p)">Auditorium B Cam 02 (1080p)</option>
                <option value="Lab 3 Frontal Cam (1080p)">Lab 3 Frontal Cam (1080p)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#565d79] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Toolbar action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Privacy Mask Toggle */}
          <button
            onClick={() => {
              setPrivacyMask(!privacyMask);
              onShowToast(
                privacyMask
                  ? 'Privacy mask deactivated. Full stream visible.'
                  : 'Privacy mask active. Non-consented face vectors blurred.'
              );
            }}
            className={`h-9 px-3.5 rounded-lg border text-[12px] font-semibold flex items-center gap-2 transition-all ${
              privacyMask
                ? 'bg-[#006e4b] text-white border-[#006e4b]'
                : 'bg-white text-[#0b1c30] border-[#dce9ff] hover:bg-[#eff4ff]'
            }`}
          >
            {privacyMask ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#565d79]" />}
            <span>Privacy Mask: {privacyMask ? 'ACTIVE' : 'OFF'}</span>
          </button>

          {/* Freeze Stream */}
          <button
            onClick={() => {
              setIsFrozen(!isFrozen);
              onShowToast(isFrozen ? 'Stream unfrozen' : 'Stream frozen for inspection');
            }}
            className={`h-9 px-3.5 rounded-lg border text-[12px] font-semibold flex items-center gap-2 transition-all ${
              isFrozen
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-[#0b1c30] border-[#dce9ff] hover:bg-[#eff4ff]'
            }`}
          >
            {isFrozen ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5 text-[#565d79]" />}
            <span>{isFrozen ? 'Resume' : 'Freeze'}</span>
          </button>

          {/* Diagnostic Crop */}
          <button
            onClick={() => onShowToast('Snapshot crop captured for telemetry export')}
            className="h-9 px-3.5 rounded-lg bg-white border border-[#dce9ff] hover:bg-[#eff4ff] text-[#0b1c30] text-[12px] font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            <Crop className="w-3.5 h-3.5 text-[#565d79]" />
            <span>Diagnostic Crop</span>
          </button>

          {/* Recalibrate */}
          <button
            onClick={() => onShowToast('Recalibrating spatial camera perspective matrix... Done (99.8% mesh)')}
            className="h-9 px-3.5 rounded-lg bg-white border border-[#dce9ff] hover:bg-[#eff4ff] text-[#0b1c30] text-[12px] font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#565d79]" />
            <span>Recalibrate</span>
          </button>

          {/* End & Save Attendance */}
          <button
            onClick={handleEndSession}
            className="h-9 px-4 rounded-lg bg-[#4f46e5] hover:bg-[#3525cd] text-white text-[12px] font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>End & Save Attendance</span>
          </button>
        </div>
      </div>

      {/* Main Split: Left Video Feed (8 cols) & Right Telemetry Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Video Canvas & Detection Stream */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Main Video Viewport */}
          <div className="relative bg-[#070e1d] rounded-2xl overflow-hidden border border-[#213145] shadow-lg min-h-[480px] flex items-center justify-center">
            {/* Background classroom camera view */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-all duration-300 ${
                privacyMask ? 'filter blur-[12px] brightness-75' : ''
              }`}
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAuDnNneYIVleXe53sgcaEaa7vaOSTI9tM_E-HvrNHbq9sskHY0T7qtImiwz_E05U_EU0UlTq8FlYxHIHJ2k20XP1EYwp9Acfm0SbwHppCznqe8F6bCEV4jNwjqn5aEY-RS_Kw-S5YAdpenYL5Lh1aqPPvZlaPwKepg3wEMuQWGqW22cdhX9mLuCLv0qr0AWl8EteY4JS5b9HpzFqEpAtMCtEGTMxZLsbNg5HfDW6eTBGxGs2RELHQvLQ')`,
                transform: `scale(${zoomLevel})`
              }}
            />

            {/* Frozen Watermark */}
            {isFrozen && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/90 text-white font-mono text-[11px] font-bold px-3 py-1 rounded-full shadow-lg z-30 flex items-center gap-1.5 animate-pulse">
                <Pause className="w-3.5 h-3.5" /> FRAME FROZEN [BUFFER INSPECTION]
              </div>
            )}

            {/* Top HUD Overlays */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
              <div className="flex items-center gap-2 bg-[#0b132b]/85 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-mono text-[11px] font-bold tracking-wider">LIVE RTSP</span>
                <span className="text-[#a2b5cd] font-mono text-[10px]">|</span>
                <span className="font-mono text-[11px] text-[#6ffbbe]">4K UHD • 29.8 FPS</span>
                <span className="text-[#a2b5cd] font-mono text-[10px]">|</span>
                <span className="text-[10px] text-[#cbdbf5]">Node #4-Alpha</span>
              </div>

              <div className="flex items-center gap-2 bg-[#0b132b]/85 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white shadow-md">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span className="text-[11px] font-bold font-mono">84 Verified</span>
                </div>
                <span className="text-[#a2b5cd] text-[10px]">/</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-[11px] font-bold font-mono text-amber-300">2 Review</span>
                </div>
              </div>
            </div>

            {/* Interactive Bounding Boxes Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-auto">
              {LIVE_DETECTIONS.map((det) => {
                const isSelected = selectedDetection.id === det.id;
                const status = overrideStatus[det.id] || det.status;

                let borderColor = 'border-[#10b981] bg-[#10b981]/15';
                let tagColor = 'bg-[#006e4b] text-[#6ffbbe]';
                if (status === 'FLAGGED') {
                  borderColor = 'border-amber-400 bg-amber-400/20';
                  tagColor = 'bg-amber-600 text-white';
                } else if (status === 'UNKNOWN') {
                  borderColor = 'border-red-500 bg-red-500/20';
                  tagColor = 'bg-red-600 text-white';
                }

                return (
                  <div
                    key={det.id}
                    onClick={() => setSelectedDetection(det)}
                    style={{
                      left: det.bbox.left,
                      top: det.bbox.top,
                      width: det.bbox.width,
                      height: det.bbox.height
                    }}
                    className={`absolute cursor-pointer border-2 rounded-xs transition-all duration-200 group ${borderColor} ${
                      isSelected ? 'ring-4 ring-[#4f46e5] ring-offset-2 ring-offset-[#0b132b] scale-105 z-30' : 'hover:scale-102'
                    }`}
                  >
                    {/* Bounding Box Corner Reticles */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white pointer-events-none"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white pointer-events-none"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white pointer-events-none"></div>
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white pointer-events-none"></div>

                    {/* Floating identification tag */}
                    <div
                      className={`absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-md flex items-center gap-1 ${tagColor}`}
                    >
                      <span>{det.name}</span>
                      <span>({det.confidence > 0 ? `${det.confidence}%` : 'NO_MATCH'})</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom HUD Bar inside video */}
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-20 pointer-events-auto">
              {/* PTZ Presets */}
              <div className="flex items-center gap-1.5 bg-[#0b132b]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white">
                <span className="text-[11px] text-[#a2b5cd] font-semibold mr-1">PTZ:</span>
                {['Preset 1 (Front Rows)', 'Preset 2 (Back Podium)', 'Wide View'].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPreset(p);
                      onShowToast(`Adjusted PTZ pan/tilt to ${p}`);
                    }}
                    className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                      preset === p ? 'bg-[#4f46e5] text-white font-bold' : 'text-[#cbdbf5] hover:bg-white/10'
                    }`}
                  >
                    {p.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Optical Zoom Slider */}
              <div className="flex items-center gap-2 bg-[#0b132b]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white">
                <span className="text-[11px] text-[#a2b5cd] font-semibold">Zoom:</span>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.1"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                  aria-label="Optical Zoom Level"
                  className="w-20 accent-[#4f46e5] cursor-pointer"
                />
                <span className="font-mono text-[11px] text-[#6ffbbe] font-bold">{zoomLevel.toFixed(1)}x</span>
              </div>
            </div>
          </div>

          {/* Detection Stream Bar */}
          <div className="bg-white rounded-xl p-4 border border-[#e5eeff] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#4f46e5]" />
                <h3 className="text-[14px] font-bold text-[#0b1c30]">
                  Real-Time Detection Stream (6 Active Tracks)
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#565d79]">Click card to inspect telemetry</span>
            </div>

            {/* Horizontal list of detected students */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {LIVE_DETECTIONS.map((det) => {
                const isSelected = selectedDetection.id === det.id;
                const status = overrideStatus[det.id] || det.status;

                return (
                  <button
                    key={det.id}
                    onClick={() => setSelectedDetection(det)}
                    className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'bg-[#eff4ff] border-[#4f46e5] ring-2 ring-[#4f46e5]/40 shadow-xs'
                        : 'bg-white border-[#e2e8f0] hover:bg-[#f8f9ff]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative bg-[#0b132b] mb-1.5 shadow-2xs">
                      {det.liveCrop ? (
                        <img className="w-full h-full object-cover" alt={det.name} src={det.liveCrop} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50 text-[10px]">
                          Crop
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 inset-x-0 text-[8px] font-mono font-bold text-center text-white py-0.5 ${
                          status === 'CONFIRMED'
                            ? 'bg-[#006e4b]'
                            : status === 'FLAGGED'
                            ? 'bg-amber-600'
                            : 'bg-red-600'
                        }`}
                      >
                        {det.confidence > 0 ? `${det.confidence}%` : 'NO_ID'}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-[#0b1c30] truncate w-full">{det.name}</span>
                    <span className="text-[9px] text-[#565d79] font-mono truncate w-full">{det.time}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 cols: Biometric Match Telemetry Inspector */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#e5eeff] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#4f46e5] uppercase tracking-wider">
                  Real-Time Biometric Analysis
                </span>
                <h2 className="text-[16px] font-bold text-[#0b1c30]">Biometric Match Telemetry</h2>
              </div>
              <span className="bg-[#eff4ff] text-[#3525cd] px-2.5 py-1 rounded font-mono text-[10px] font-bold">
                128-d Vector
              </span>
            </div>

            {/* Side by side comparison: Live Crop vs SIS Enrolled */}
            <div className="grid grid-cols-2 gap-3 bg-[#eff4ff]/60 border border-[#dce9ff]/60 rounded-xl p-3">
              {/* Live Capture */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-[#565d79] mb-1.5 uppercase">Live Crop</span>
                <div className="w-24 h-24 rounded-xl overflow-hidden relative shadow-sm border-2 border-[#4f46e5] bg-[#0b132b]">
                  {selectedDetection.liveCrop ? (
                    <img
                      className="w-full h-full object-cover"
                      alt="Live Crop"
                      src={selectedDetection.liveCrop}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/50 text-[11px]">
                      No Image
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-[#0b132b]/85 text-[9px] font-mono text-center text-[#6ffbbe] py-0.5">
                    CAM-01
                  </span>
                </div>
                <span className="text-[10px] text-[#565d79] mt-1 font-mono">{selectedDetection.time}</span>
              </div>

              {/* SIS Master Template */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-[#565d79] mb-1.5 uppercase">SIS Enrolled</span>
                <div className="w-24 h-24 rounded-xl overflow-hidden relative shadow-sm border-2 border-[#cbd5e1] bg-white">
                  {selectedDetection.avatar ? (
                    <img
                      className="w-full h-full object-cover"
                      alt="SIS Reference"
                      src={selectedDetection.avatar}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#565d79] text-[11px] font-medium bg-[#f1f5f9]">
                      Unregistered
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-[#213145]/85 text-[9px] font-mono text-center text-white py-0.5">
                    VERIFIED
                  </span>
                </div>
                <span className="text-[10px] text-[#565d79] mt-1 font-mono">
                  ID: {selectedDetection.studentId}
                </span>
              </div>
            </div>

            {/* Cosine Similarity Gauge & Score */}
            <div className="bg-[#f8f9ff] border border-[#e5eeff] rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#565d79]">Cosine Match Metric</span>
                <span
                  className={`font-mono text-[16px] font-bold ${
                    currentStatus === 'CONFIRMED'
                      ? 'text-[#006e4b]'
                      : currentStatus === 'FLAGGED'
                      ? 'text-amber-800'
                      : 'text-red-700'
                  }`}
                >
                  {selectedDetection.confidence > 0 ? `${selectedDetection.confidence}%` : '0.00%'}
                </span>
              </div>

              {/* Confidence Bar with Gate Marker at 82% */}
              <div className="relative w-full bg-[#e2e8f0] h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    currentStatus === 'CONFIRMED'
                      ? 'bg-[#006e4b]'
                      : currentStatus === 'FLAGGED'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${selectedDetection.confidence}%` }}
                ></div>
                {/* Gate line at 82% */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-black/60 z-10"
                  style={{ left: '82%' }}
                  title="Strict Gate Threshold: 0.820"
                ></div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-[#565d79]">
                <span>Min Gate: 82.0%</span>
                <span>Euclidian Dist: {selectedDetection.euclidianDist ?? 0.12}</span>
              </div>
            </div>

            {/* Telemetry Metrics list */}
            <div className="flex flex-col divide-y divide-[#f1f5f9] text-[12px]">
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#565d79]">Head Pose Angles:</span>
                <span className="font-mono text-[#0b1c30] font-semibold">
                  {selectedDetection.poseAngle || 'Yaw 0.0° Pitch 0.0°'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#565d79]">Lighting Lux:</span>
                <span className="font-mono text-[#0b1c30] font-semibold">
                  {selectedDetection.lighting || '480 Lux'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#565d79]">Academic Standing:</span>
                <span className="text-[#006e4b] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Good Standing (FERPA Opt-In)
                </span>
              </div>
              {selectedDetection.note && (
                <div className="py-2 flex items-center justify-between text-amber-800 bg-amber-50/60 px-2 rounded">
                  <span className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Note:
                  </span>
                  <span className="font-medium text-[11px]">{selectedDetection.note}</span>
                </div>
              )}
            </div>

            {/* Current Match Verification Status */}
            <div
              className={`p-3 rounded-xl border flex items-center gap-3 ${
                currentStatus === 'CONFIRMED'
                  ? 'bg-[#67f4b7]/15 border-[#006e4b]/30 text-[#005338]'
                  : currentStatus === 'FLAGGED'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              {currentStatus === 'CONFIRMED' ? (
                <CheckCircle2 className="w-5 h-5 text-[#006e4b] shrink-0" />
              ) : currentStatus === 'FLAGGED' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div className="flex flex-col leading-tight">
                <span className="text-[12px] font-bold">
                  {currentStatus === 'CONFIRMED'
                    ? 'VERIFIED & ATTENDANCE RECORDED'
                    : currentStatus === 'FLAGGED'
                    ? 'FLAGGED FOR MANUAL REVIEW'
                    : 'UNREGISTERED / UNKNOWN SUBJECT'}
                </span>
                <span className="text-[10px] opacity-80 mt-0.5">
                  {currentStatus === 'CONFIRMED'
                    ? 'Cosine similarity above 0.820 threshold.'
                    : currentStatus === 'FLAGGED'
                    ? 'Review queue ticket created for instructor audit.'
                    : 'Subject has no biometric template in registry.'}
                </span>
              </div>
            </div>

            {/* Manual Instructor Action Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#e5eeff]">
              <span className="text-[11px] font-bold text-[#565d79] uppercase tracking-wider">
                Instructor Manual Override
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleConfirmPresence}
                  className="py-2 px-3 rounded-lg bg-[#006e4b] hover:bg-[#005338] text-white text-[12px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" /> Confirm Presence
                </button>
                <button
                  onClick={handleSendToReview}
                  className="py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Flag className="w-3.5 h-3.5" /> Send to Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
