import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Cpu,
  Sliders,
  Camera,
  Lock,
  Save,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

interface SettingsViewProps {
  onShowToast: (msg: string, icon?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  const [threshold, setThreshold] = useState(0.82);
  const [model, setModel] = useState('ArcFace-ResNet100');
  const [livenessStrictness, setLivenessStrictness] = useState('High (3D + Microblink)');
  const [privacyBlurDefault, setPrivacyBlurDefault] = useState(false);
  const [retentionDays, setRetentionDays] = useState('0 (Discard after class)');
  const [maxFps, setMaxFps] = useState('30');

  const handleSave = () => {
    onShowToast('CV node inference settings saved and synchronized to cluster.');
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-[#565d79]">
            <span className="font-semibold text-[#4f46e5] uppercase tracking-wider">System Administration</span>
            <span>•</span>
            <span>Computer Vision & Privacy Matrix</span>
          </div>
          <h1 className="text-[26px] font-bold text-[#0b1c30] tracking-tight mt-0.5">
            Engine & Pipeline Settings
          </h1>
        </div>

        <button
          onClick={handleSave}
          className="h-9 px-4 rounded-lg bg-[#4f46e5] hover:bg-[#3525cd] text-white text-[12px] font-bold shadow-sm transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Configuration</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Computer Vision Model Settings */}
        <div className="bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#e5eeff]">
            <Cpu className="w-5 h-5 text-[#3525cd]" />
            <h2 className="text-[16px] font-bold text-[#0b1c30]">Inference & Model Parameters</h2>
          </div>

          {/* Model selection */}
          <div>
            <label className="block text-[12px] font-bold text-[#565d79] uppercase mb-1.5">
              Face Recognition Model Architecture
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-[13px] font-semibold border border-transparent focus:border-[#4f46e5]"
            >
              <option value="ArcFace-ResNet100">ArcFace (ResNet-100 • 128-d Tensor) [Recommended]</option>
              <option value="InsightFace-Glore">InsightFace Glore50 (512-d Tensor)</option>
              <option value="YOLOv8x-Face">YOLOv8x-Face (Ultra High Density Detection)</option>
            </select>
          </div>

          {/* Cosine Threshold Slider */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-bold text-[#565d79] uppercase">
                Cosine Similarity Decision Threshold Gate
              </label>
              <span className="font-mono text-[14px] font-bold text-[#3525cd]">{threshold.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.70"
              max="0.95"
              step="0.005"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              aria-label="Cosine Similarity Decision Threshold Gate"
              className="w-full accent-[#4f46e5] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#565d79] font-mono">
              <span>0.700 (Lenient)</span>
              <span className="text-[#006e4b] font-bold">Standard: 0.820</span>
              <span>0.950 (Strict)</span>
            </div>
            <p className="text-[11px] text-[#565d79] leading-relaxed">
              Matches above this score are automatically registered as verified. Matches below are sent to the
              Instructor Review Queue.
            </p>
          </div>

          {/* Liveness Strictness */}
          <div>
            <label className="block text-[12px] font-bold text-[#565d79] uppercase mb-1.5">
              Anti-Spoofing & Liveness Filter
            </label>
            <select
              value={livenessStrictness}
              onChange={(e) => setLivenessStrictness(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-[13px] font-semibold border border-transparent focus:border-[#4f46e5]"
            >
              <option value="High (3D + Microblink)">High (Stereo 3D Mesh + Microblink detection)</option>
              <option value="Standard">Standard (Texture Fourier analysis)</option>
              <option value="Disabled (Testing only)">Disabled (Debug only)</option>
            </select>
          </div>
        </div>

        {/* FERPA & Data Privacy Policies */}
        <div className="bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#e5eeff]">
            <ShieldCheck className="w-5 h-5 text-[#006e4b]" />
            <h2 className="text-[16px] font-bold text-[#0b1c30]">Institutional Privacy & FERPA</h2>
          </div>

          {/* Raw Frame Retention Policy */}
          <div>
            <label className="block text-[12px] font-bold text-[#565d79] uppercase mb-1.5">
              Raw Video Frame Retention
            </label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-[13px] font-semibold border border-transparent focus:border-[#4f46e5]"
            >
              <option value="0 (Discard after class)">0 Days (Ephemeral RAM only • Recommended)</option>
              <option value="7 days">7 Days (Audit buffer)</option>
              <option value="30 days">30 Days (End of monthly cycle)</option>
            </select>
          </div>

          {/* Default Privacy Mask */}
          <div className="flex items-center justify-between p-3.5 bg-[#eff4ff]/60 rounded-xl border border-[#dce9ff]">
            <div>
              <span className="text-[13px] font-bold text-[#0b1c30] block">Default Privacy Masking</span>
              <span className="text-[11px] text-[#565d79]">
                Automatically blur classroom background and non-consented students
              </span>
            </div>
            <input
              type="checkbox"
              checked={privacyBlurDefault}
              onChange={(e) => setPrivacyBlurDefault(e.target.checked)}
              aria-label="Toggle Default Privacy Masking"
              className="w-5 h-5 rounded text-[#4f46e5] cursor-pointer"
            />
          </div>

          {/* RTSP Stream FPS Cap */}
          <div>
            <label className="block text-[12px] font-bold text-[#565d79] uppercase mb-1.5">
              Target RTSP Frame Rate (per camera)
            </label>
            <select
              value={maxFps}
              onChange={(e) => setMaxFps(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-[13px] font-semibold border border-transparent focus:border-[#4f46e5]"
            >
              <option value="30">30 FPS (Fluid 4K / 1080p stream)</option>
              <option value="20">20 FPS (Optimized edge bandwidth)</option>
              <option value="15">15 FPS (Low power mode)</option>
            </select>
          </div>

          <div className="p-3 bg-[#67f4b7]/15 rounded-xl border border-[#006e4b]/20 text-[11px] text-[#005338] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#006e4b]" />
            <span>Cryptographic audit hashing is continuously signed with institution's private key.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
