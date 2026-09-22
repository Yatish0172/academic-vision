import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Sliders,
  Check,
  X,
  Search,
  Layers,
  Sparkles,
  ShieldCheck,
  Keyboard,
  Info
} from 'lucide-react';
import { ReviewDiscrepancy } from '../types';
import { REVIEW_DISCREPANCIES } from '../data/mockData';

interface ReviewQueueViewProps {
  onShowToast: (msg: string, icon?: string) => void;
  onCountChange?: (count: number) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  onShowToast,
  onCountChange
}) => {
  const [items, setItems] = useState<ReviewDiscrepancy[]>(REVIEW_DISCREPANCIES);
  const [selectedId, setSelectedId] = useState<string>(REVIEW_DISCREPANCIES[0].id);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeItem = items.find((it) => it.id === selectedId) || items[0];
  const pendingCount = items.filter((it) => it.status === 'pending').length;

  useEffect(() => {
    onCountChange?.(pendingCount);
  }, [pendingCount, onCountChange]);

  // Keyboard shortcuts [A], [R], [S]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'a' || e.key === 'A') {
        handleReject();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRescan();
      } else if (e.key === 's' || e.key === 'S') {
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem]);

  const handleConfirm = () => {
    if (!activeItem) return;
    setItems((prev) =>
      prev.map((it) => (it.id === activeItem.id ? { ...it, status: 'confirmed' } : it))
    );
    onShowToast(`Confirmed verified match for ${activeItem.studentName} (Marked Present)`, 'check');
    advanceToNextPending(activeItem.id);
  };

  const handleReject = () => {
    if (!activeItem) return;
    setItems((prev) =>
      prev.map((it) => (it.id === activeItem.id ? { ...it, status: 'rejected' } : it))
    );
    onShowToast(`Rejected biometric match for ${activeItem.studentName} (Marked Absent)`, 'x');
    advanceToNextPending(activeItem.id);
  };

  const handleRescan = () => {
    if (!activeItem) return;
    setItems((prev) =>
      prev.map((it) => (it.id === activeItem.id ? { ...it, status: 'rescan' } : it))
    );
    onShowToast(`Flagged ${activeItem.studentName} for secondary camera rescan at desk`, 'refresh');
    advanceToNextPending(activeItem.id);
  };

  const advanceToNextPending = (currentId: string) => {
    const next = items.find((it) => it.id !== currentId && it.status === 'pending');
    if (next) {
      setSelectedId(next.id);
    }
  };

  const handleBatchResolveClean = () => {
    setBatchModalOpen(false);
    setItems((prev) =>
      prev.map((it) => (it.score >= 0.77 ? { ...it, status: 'confirmed' } : it))
    );
    onShowToast('Batch confirmed 3 marginal candidates with clean liveness checks.');
  };

  const filteredItems = items.filter((it) => {
    const matchesSearch =
      it.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.studentId.includes(searchQuery) ||
      it.course.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterCategory === 'all') return true;
    return it.category === filterCategory;
  });

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Top Header & Discrepancy Statistics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[12px] text-[#565d79]">
            <span className="font-semibold text-amber-700 uppercase tracking-wider">
              Human-in-the-Loop Validation
            </span>
            <span>•</span>
            <span className="font-mono text-[#3525cd] font-bold">
              {pendingCount} PENDING FLAGS
            </span>
          </div>
          <h1 className="text-[26px] font-bold text-[#0b1c30] tracking-tight mt-0.5">
            Discrepancy Review Queue
          </h1>
        </div>

        {/* Action button: Batch Resolve */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBatchModalOpen(true)}
            className="h-9 px-4 rounded-lg bg-white border border-[#dce9ff] hover:bg-[#eff4ff] text-[#3525cd] text-[12px] font-bold shadow-xs transition-all flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4f46e5]" />
            <span>Batch Resolve Clean (3)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5eeff] pb-3">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            filterCategory === 'all'
              ? 'bg-[#213145] text-white shadow-xs'
              : 'bg-white text-[#565d79] hover:bg-[#eff4ff] border border-[#e2e8f0]'
          }`}
        >
          All Flags ({items.length})
        </button>
        <button
          onClick={() => setFilterCategory('low-confidence')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            filterCategory === 'low-confidence'
              ? 'bg-[#213145] text-white shadow-xs'
              : 'bg-white text-[#565d79] hover:bg-[#eff4ff] border border-[#e2e8f0]'
          }`}
        >
          Low Confidence (4)
        </button>
        <button
          onClick={() => setFilterCategory('lighting')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            filterCategory === 'lighting'
              ? 'bg-[#213145] text-white shadow-xs'
              : 'bg-white text-[#565d79] hover:bg-[#eff4ff] border border-[#e2e8f0]'
          }`}
        >
          Angle & Lighting (2)
        </button>
        <button
          onClick={() => setFilterCategory('multi-face')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            filterCategory === 'multi-face'
              ? 'bg-[#213145] text-white shadow-xs'
              : 'bg-white text-[#565d79] hover:bg-[#eff4ff] border border-[#e2e8f0]'
          }`}
        >
          Multi-Face Dispute (1)
        </button>

        {/* Keyboard shortcut hint */}
        <div className="ml-auto hidden md:flex items-center gap-3 text-[11px] text-[#565d79] font-mono">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-[#cbd5e1] rounded shadow-2xs font-bold text-[#0b1c30]">
              A
            </kbd>{' '}
            Reject
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-[#cbd5e1] rounded shadow-2xs font-bold text-[#0b1c30]">
              R
            </kbd>{' '}
            Rescan
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-[#cbd5e1] rounded shadow-2xs font-bold text-[#0b1c30]">
              S
            </kbd>{' '}
            Confirm
          </span>
        </div>
      </div>

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Primary Side-by-Side Comparison Canvas */}
        {activeItem ? (
          <div className="lg:col-span-8 flex flex-col gap-5 bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-xs">
            {/* Header info of active subject */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5eeff] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[20px] font-bold text-[#0b1c30]">{activeItem.studentName}</h2>
                  <span className="text-[12px] font-mono text-[#565d79] bg-[#eff4ff] px-2 py-0.5 rounded border border-[#dce9ff]">
                    ID: #{activeItem.studentId}
                  </span>
                </div>
                <p className="text-[12px] text-[#565d79] mt-0.5">{activeItem.course}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  {activeItem.flagType}
                </span>
                <button
                  onClick={() => setShowLandmarks(!showLandmarks)}
                  className={`p-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all ${
                    showLandmarks
                      ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                      : 'bg-white text-[#565d79] border-[#dce9ff]'
                  }`}
                  title="Toggle 68-point facial mesh overlay"
                >
                  <Layers className="w-4 h-4" />
                  <span>Landmarks</span>
                </button>
              </div>
            </div>

            {/* Side-by-Side Inspection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Live Classroom Capture */}
              <div className="flex flex-col bg-[#070e1d] rounded-xl overflow-hidden border border-[#213145] p-3 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold text-[#6ffbbe] uppercase tracking-wider">
                    Live Classroom Capture
                  </span>
                  <span className="text-[10px] font-mono text-[#a2b5cd]">{activeItem.timestamp}</span>
                </div>

                <div className="relative aspect-square rounded-lg overflow-hidden bg-black flex items-center justify-center">
                  <img
                    className="w-full h-full object-cover"
                    alt="Live Classroom Capture"
                    src={activeItem.liveCaptureImg}
                  />

                  {/* Simulated 68 Landmark overlay */}
                  {showLandmarks && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" viewBox="0 0 100 100">
                      {/* Face contour points */}
                      <circle cx="35" cy="45" r="1.2" fill="#6ffbbe" />
                      <circle cx="45" cy="45" r="1.2" fill="#6ffbbe" />
                      <circle cx="55" cy="45" r="1.2" fill="#6ffbbe" />
                      <circle cx="65" cy="45" r="1.2" fill="#6ffbbe" />
                      {/* Nose */}
                      <circle cx="50" cy="55" r="1.2" fill="#6ffbbe" />
                      <circle cx="47" cy="58" r="1.2" fill="#6ffbbe" />
                      <circle cx="53" cy="58" r="1.2" fill="#6ffbbe" />
                      {/* Mouth */}
                      <circle cx="42" cy="70" r="1.2" fill="#6ffbbe" />
                      <circle cx="50" cy="69" r="1.2" fill="#6ffbbe" />
                      <circle cx="58" cy="70" r="1.2" fill="#6ffbbe" />
                      <path
                        d="M35 45 Q50 35 65 45 M42 70 Q50 74 58 70"
                        stroke="#6ffbbe"
                        strokeWidth="0.5"
                        fill="none"
                      />
                    </svg>
                  )}

                  {/* Camera Node HUD Tag */}
                  <span className="absolute bottom-2 left-2 bg-[#0b132b]/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-[#cbdbf5]">
                    {activeItem.venue}
                  </span>
                </div>

                {/* Diagnostics below image */}
                <div className="grid grid-cols-3 gap-1 mt-2 text-center text-[10px] font-mono">
                  <div className="bg-[#182433] py-1 rounded">Yaw: -28.4°</div>
                  <div className="bg-[#182433] py-1 rounded text-amber-300">Lum: 42 Lux</div>
                  <div className="bg-[#182433] py-1 rounded">{activeItem.faceBox}</div>
                </div>
              </div>

              {/* Official Biometric Reference (SIS Master) */}
              <div className="flex flex-col bg-[#f8f9ff] rounded-xl overflow-hidden border border-[#dce9ff] p-3 text-[#0b1c30]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold text-[#4f46e5] uppercase tracking-wider">
                    Official SIS Master Template
                  </span>
                  <span className="text-[10px] font-mono text-[#565d79]">{activeItem.enrolledDate}</span>
                </div>

                <div className="relative aspect-square rounded-lg overflow-hidden bg-white flex items-center justify-center border border-[#cbd5e1]">
                  <img
                    className="w-full h-full object-cover"
                    alt="Official SIS Template"
                    src={activeItem.enrolledImg}
                  />

                  {/* Simulated Reference Landmarks */}
                  {showLandmarks && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" viewBox="0 0 100 100">
                      <circle cx="36" cy="42" r="1.2" fill="#4f46e5" />
                      <circle cx="44" cy="42" r="1.2" fill="#4f46e5" />
                      <circle cx="56" cy="42" r="1.2" fill="#4f46e5" />
                      <circle cx="64" cy="42" r="1.2" fill="#4f46e5" />
                      <circle cx="50" cy="52" r="1.2" fill="#4f46e5" />
                      <circle cx="48" cy="56" r="1.2" fill="#4f46e5" />
                      <circle cx="52" cy="56" r="1.2" fill="#4f46e5" />
                      <circle cx="42" cy="68" r="1.2" fill="#4f46e5" />
                      <circle cx="50" cy="67" r="1.2" fill="#4f46e5" />
                      <circle cx="58" cy="68" r="1.2" fill="#4f46e5" />
                      <path
                        d="M36 42 Q50 32 64 42 M42 68 Q50 72 58 68"
                        stroke="#4f46e5"
                        strokeWidth="0.5"
                        fill="none"
                      />
                    </svg>
                  )}

                  <span className="absolute bottom-2 left-2 bg-[#213145]/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-white">
                    VERIFIED ENROLLMENT
                  </span>
                </div>

                {/* Diagnostics below reference */}
                <div className="grid grid-cols-3 gap-1 mt-2 text-center text-[10px] font-mono">
                  <div className="bg-[#eff4ff] py-1 rounded text-[#3525cd]">Norm: {activeItem.vectorNorm}</div>
                  <div className="bg-[#eff4ff] py-1 rounded text-[#565d79]">1024x1024</div>
                  <div className="bg-[#eff4ff] py-1 rounded text-[#006e4b] font-bold">FERPA Opt-In</div>
                </div>
              </div>
            </div>

            {/* Cosine Similarity & Threshold Analysis Bar */}
            <div className="bg-[#eff4ff]/60 border border-[#dce9ff]/60 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#565d79] uppercase tracking-wider">
                    Cosine Similarity Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-mono text-[24px] font-bold text-amber-800">
                      {activeItem.score.toFixed(3)}
                    </span>
                    <span className="text-[12px] text-[#565d79]">
                      vs Required <span className="font-mono font-bold text-[#0b1c30]">0.820</span> (Delta -
                      {(0.82 - activeItem.score).toFixed(3)})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[#67f4b7]/20 text-[#005338] px-3 py-1 rounded-full text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#006e4b]" />
                  <span>Liveness: PASS (Micro-blink & 3D Depth)</span>
                </div>
              </div>

              {/* Graphic Slider */}
              <div className="relative w-full bg-[#cbd5e1] h-3 rounded-full overflow-hidden mt-1">
                {/* Score bar */}
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${activeItem.score * 100}%` }}
                ></div>
                {/* 0.820 gate vertical line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-red-600 z-10"
                  style={{ left: '82%' }}
                  title="Gate 0.820"
                ></div>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-[#565d79]">
                <span>0.000</span>
                <span className="text-amber-700 font-bold">Current: {activeItem.score.toFixed(3)}</span>
                <span className="text-red-700 font-bold">Gate: 0.820</span>
                <span>1.000 (Exact Match)</span>
              </div>
            </div>

            {/* Current Item Status Indicator if resolved */}
            {activeItem.status !== 'pending' && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-[12px] font-bold ${
                  activeItem.status === 'confirmed'
                    ? 'bg-[#67f4b7]/20 border-[#006e4b] text-[#005338]'
                    : activeItem.status === 'rejected'
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-amber-50 border-amber-400 text-amber-800'
                }`}
              >
                <span>
                  Action Recorded:{' '}
                  {activeItem.status === 'confirmed'
                    ? 'CONFIRMED MATCH (PRESENT)'
                    : activeItem.status === 'rejected'
                    ? 'REJECTED (ABSENT)'
                    : 'SECONDARY RESCAN SCHEDULED'}
                </span>
                <button
                  onClick={() =>
                    setItems((prev) =>
                      prev.map((it) => (it.id === activeItem.id ? { ...it, status: 'pending' } : it))
                    )
                  }
                  className="text-[11px] underline font-medium"
                >
                  Undo Action
                </button>
              </div>
            )}

            {/* Bottom 3 Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#e5eeff]">
              <button
                onClick={handleReject}
                className="py-2.5 px-4 rounded-xl bg-white border border-[#e2e8f0] text-red-700 hover:bg-red-50 font-bold text-[13px] shadow-2xs transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <X className="w-4 h-4 text-red-600" />
                <span>Reject (Mark Absent) [A]</span>
              </button>

              <button
                onClick={handleRescan}
                className="py-2.5 px-4 rounded-xl bg-white border border-[#e2e8f0] text-amber-800 hover:bg-amber-50 font-bold text-[13px] shadow-2xs transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Flag for Rescan [R]</span>
              </button>

              <button
                onClick={handleConfirm}
                className="py-2.5 px-4 rounded-xl bg-[#006e4b] hover:bg-[#005338] text-white font-bold text-[13px] shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Confirm Verified Match [S]</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-[#e5eeff]">
            <CheckCircle2 className="w-12 h-12 text-[#006e4b] mb-3" />
            <h2 className="text-[20px] font-bold text-[#0b1c30]">All Queue Flags Cleared</h2>
            <p className="text-[13px] text-[#565d79] mt-1 max-w-md">
              There are no more low-confidence biometric discrepancies pending human review.
            </p>
          </div>
        )}

        {/* Right 4 Cols: Pending Queue Roster List */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-[#0b1c30]">Pending Discrepancy Roster</h3>
              <span className="font-mono text-[11px] text-[#565d79] font-bold">
                {filteredItems.length} items
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#565d79]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queue..."
                className="w-full h-8 pl-9 pr-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[12px] placeholder:text-[#565d79]/60 focus:outline-none focus:bg-white border border-transparent focus:border-[#4f46e5] transition-all"
              />
            </div>

            {/* Item List */}
            <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const isSelected = item.id === selectedId;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#eff4ff] border-[#4f46e5] ring-2 ring-[#4f46e5]/40 shadow-xs'
                        : 'bg-white border-[#e2e8f0] hover:bg-[#f8f9ff]'
                    }`}
                  >
                    {/* Mini live crop thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative bg-[#0b132b] border border-[#cbd5e1]">
                      <img className="w-full h-full object-cover" alt={item.studentName} src={item.liveCaptureImg} />
                      <span className="absolute bottom-0 inset-x-0 bg-[#0b132b]/80 text-[8px] font-mono text-center text-white py-0.5">
                        {item.score.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[#0b1c30] truncate">
                          {item.studentName}
                        </span>
                        <span className="font-mono text-[10px] text-[#565d79]">ID #{item.studentId}</span>
                      </div>

                      <span className="text-[10px] text-[#565d79] truncate mt-0.5">{item.course}</span>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {item.flagType}
                        </span>

                        {item.status === 'confirmed' ? (
                          <span className="text-[10px] text-[#006e4b] font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Confirmed
                          </span>
                        ) : item.status === 'rejected' ? (
                          <span className="text-[10px] text-red-600 font-bold flex items-center gap-0.5">
                            <X className="w-3 h-3" /> Rejected
                          </span>
                        ) : item.status === 'rescan' ? (
                          <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                            <RotateCcw className="w-3 h-3" /> Rescan
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-700 font-semibold">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Batch Resolve Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e5eeff] flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#3525cd] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#0b1c30]">Batch Resolve Clean Candidates</h3>
                <p className="text-[12px] text-[#565d79]">Apply heuristic clearance rules</p>
              </div>
            </div>

            <p className="text-[13px] text-[#565d79] leading-relaxed">
              3 pending items scored between <span className="font-mono font-bold text-[#0b1c30]">0.770</span> and{' '}
              <span className="font-mono font-bold text-[#0b1c30]">0.819</span>, and passed all 3D optical liveness and
              micro-blink checks. Would you like to batch-confirm them as verified present?
            </p>

            <div className="bg-[#eff4ff] p-3 rounded-xl border border-[#dce9ff] text-[12px] flex flex-col gap-1">
              <div className="flex justify-between font-medium text-[#0b1c30]">
                <span>Priya Patel (#9823411)</span>
                <span className="font-mono font-bold text-[#006e4b]">0.805 SIM</span>
              </div>
              <div className="flex justify-between font-medium text-[#0b1c30]">
                <span>Marcus Vance (#12345)</span>
                <span className="font-mono font-bold text-[#006e4b]">0.795 SIM</span>
              </div>
              <div className="flex justify-between font-medium text-[#0b1c30]">
                <span>Elena Rostova (#8821049)</span>
                <span className="font-mono font-bold text-[#006e4b]">0.778 SIM</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBatchModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#565d79] hover:bg-[#f8f9ff] text-[12px] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchResolveClean}
                className="px-4 py-2 rounded-lg bg-[#006e4b] hover:bg-[#005338] text-white text-[12px] font-bold shadow-sm"
              >
                Confirm All 3 Candidates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
