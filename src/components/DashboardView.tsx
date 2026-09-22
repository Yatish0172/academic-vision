import React, { useState } from 'react';
import {
  Fingerprint,
  Radio,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  FileDown,
  PlusCircle,
  Clock,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Lock,
  Search,
  BellRing,
  Check,
  X,
  LayoutGrid
} from 'lucide-react';
import { ClassroomVenue, NavigationTab } from '../types';
import { CLASSROOM_VENUES } from '../data/mockData';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onInspectVenue: (venueId: string) => void;
  onShowToast: (msg: string, icon?: string) => void;
  onSelectStudentForTelemetry?: (studentId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onInspectVenue,
  onShowToast,
  onSelectStudentForTelemetry
}) => {
  const [searchRoster, setSearchRoster] = useState('');
  const [reviewRequiredHandled, setReviewRequiredHandled] = useState<string | null>(null);
  const [isSyncingSIS, setIsSyncingSIS] = useState(false);

  const rosterStudents = [
    {
      seat: 'A-12',
      id: '590012832',
      name: 'Yatish Sharma',
      initials: 'YS',
      programme: 'B.Tech AI & ML • Sem 5',
      consent: 'OPTED_IN',
      confidence: 99.4,
      timestamp: '10:02:14 AM'
    },
    {
      seat: 'A-14',
      id: '123456789',
      name: 'Anmol Verma',
      initials: 'AV',
      programme: 'B.Tech CSE • Sem 5',
      consent: 'OPTED_IN',
      confidence: 98.1,
      timestamp: '10:04:32 AM'
    },
    {
      seat: 'B-03',
      id: '849201991',
      name: 'Yash Singhal',
      initials: 'YS',
      programme: 'B.Tech Robotics • Sem 5',
      consent: 'OPTED_IN',
      confidence: 78.4,
      timestamp: '10:25:40 AM',
      isReview: true
    },
    {
      seat: 'C-08',
      id: '990184271',
      name: 'Maya Chen',
      initials: 'MC',
      programme: 'B.Tech AI & ML • Sem 5',
      consent: 'OPTED_IN',
      confidence: 99.7,
      timestamp: '10:01:05 AM'
    }
  ];

  const filteredRoster = rosterStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(searchRoster.toLowerCase()) ||
      s.id.includes(searchRoster) ||
      s.seat.toLowerCase().includes(searchRoster.toLowerCase())
  );

  const handleSyncSIS = () => {
    setIsSyncingSIS(true);
    setTimeout(() => {
      setIsSyncingSIS(false);
      onShowToast('SIS Roster synchronized: 1,420 active student records verified with registrar.');
    }, 1200);
  };

  const handleExportAudit = () => {
    onShowToast('Exporting accreditation PDF & Attendance CSV to downloads...');
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Top Action Toolbar & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[12px] text-[#565d79]">
            <span className="uppercase tracking-wider font-semibold text-[#565d79]">Campus Central Hub</span>
            <span className="opacity-40">/</span>
            <span className="text-[#3525cd] font-semibold">Real-Time Telemetry</span>
          </div>
          <h1 className="text-[28px] font-bold text-[#0b1c30] tracking-tight mt-0.5">
            Active Session Command Center
          </h1>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncSIS}
            disabled={isSyncingSIS}
            className="h-9 px-4 rounded-lg bg-white text-[#0b1c30] border border-[#e2e8f0] hover:bg-[#eff4ff] shadow-xs transition-all flex items-center gap-2 text-[12px] font-semibold active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#3525cd] ${isSyncingSIS ? 'animate-spin' : ''}`} />
            <span>Sync SIS Roster</span>
          </button>

          <button
            onClick={handleExportAudit}
            className="h-9 px-4 rounded-lg bg-white text-[#0b1c30] border border-[#e2e8f0] hover:bg-[#eff4ff] shadow-xs transition-all flex items-center gap-2 text-[12px] font-semibold active:scale-95"
          >
            <FileDown className="w-3.5 h-3.5 text-[#565d79]" />
            <span>Export Audit Report</span>
          </button>

          <button
            onClick={() => onNavigate('live-capture')}
            className="h-9 px-4 rounded-lg bg-[#4f46e5] text-white hover:bg-[#3525cd] shadow-sm transition-all flex items-center gap-2 text-[12px] font-semibold active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-white" />
            <span>Start New Session</span>
          </button>
        </div>
      </div>

      {/* Hero Telemetry Metric Tiles (5 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Biometrics */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e5eeff] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#565d79] uppercase tracking-wider">
              Total Biometrics
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#3525cd]">
              <Fingerprint className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-bold text-[#0b1c30] leading-none">1,420</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px]">
              <span className="text-[#006e4b] font-semibold flex items-center">↑ +38</span>
              <span className="text-[#565d79]">from last term</span>
            </div>
          </div>
        </div>

        {/* Active Capture */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e5eeff] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#565d79] uppercase tracking-wider">
              Active Capture
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#e2dfff] flex items-center justify-center text-[#3525cd]">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1 text-[26px] font-bold text-[#0b1c30] leading-none">
              4 <span className="text-[12px] font-normal text-[#565d79]">Lecture Venues</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#3525cd] font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#4f46e5] animate-pulse"></span>
              <span>12 Inference Nodes Online</span>
            </div>
          </div>
        </div>

        {/* Real-time Present */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e5eeff] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#565d79] uppercase tracking-wider">
              Real-time Present
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#67f4b7]/20 flex items-center justify-center text-[#005338]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-[26px] font-bold text-[#006e4b] leading-none">92.6%</div>
              <div className="text-[11px] text-[#565d79] mt-2">264/285 Confirmed</div>
            </div>
            {/* SVG Mini Radial */}
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#eff4ff]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-[#006e4b] stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeDasharray="92.6, 100"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
          </div>
        </div>

        {/* Review Queue */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e5eeff] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#565d79] uppercase tracking-wider">
              Review Queue
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1 text-[26px] font-bold text-[#0b1c30] leading-none">
              7 <span className="text-[12px] font-normal text-[#565d79]">Low Confidence</span>
            </div>
            <div className="mt-2 text-[11px] text-[#565d79]">
              Requires manual instructor pass
            </div>
          </div>
        </div>

        {/* Pipeline Anomalies */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e5eeff] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#565d79] uppercase tracking-wider">
              Pipeline Anomalies
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1 text-[26px] font-bold text-[#ba1a1a] leading-none">
              2 <span className="text-[12px] font-normal text-[#565d79]">Camera Occlusions</span>
            </div>
            <div className="mt-2 text-[11px] text-[#ba1a1a] font-semibold">
              Node 04 & 09 Degradation
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Classroom Venues */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#0b1c30]">Live Classroom Venues</h2>
              <span className="bg-[#e5eeff] text-[#3525cd] px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold">
                4 running
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#565d79]">
              <button
                onClick={() => onShowToast('RTSP stream grid view active')}
                className="p-1.5 rounded-lg hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors"
                title="Grid Layout"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onShowToast('All 4 camera RTSP feeds refreshed')}
                className="p-1.5 rounded-lg hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors"
                title="Refresh Streams"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4 Cards Grid for Sessions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CLASSROOM_VENUES.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-xl overflow-hidden border border-[#e5eeff] shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
              >
                {/* Simulated Camera Feed Canvas */}
                <div className="relative h-44 bg-[#0b132b] overflow-hidden">
                  <div
                    className="bg-cover bg-center w-full h-full opacity-85 group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('${venue.bgImage}')` }}
                  />

                  {/* Synthetic Bounding Boxes */}
                  <div className="absolute inset-0 p-3 pointer-events-none">
                    <div className="absolute left-1/4 top-1/3 w-12 h-14 border-2 border-[#10b981] bg-[#10b981]/15 rounded-xs">
                      <span className="absolute -top-3.5 left-0 bg-[#0b132b] text-[#6ffbbe] font-mono text-[9px] px-1 rounded">
                        98.4%
                      </span>
                    </div>
                    <div className="absolute right-1/3 top-2/5 w-10 h-12 border-2 border-[#10b981] bg-[#10b981]/15 rounded-xs">
                      <span className="absolute -top-3.5 left-0 bg-[#0b132b] text-[#6ffbbe] font-mono text-[9px] px-1 rounded">
                        99.1%
                      </span>
                    </div>
                    {venue.id === 'venue-1' && (
                      <div className="absolute right-1/4 bottom-4 w-11 h-12 border-2 border-amber-400 bg-amber-400/20 rounded-xs">
                        <span className="absolute -top-3.5 left-0 bg-[#0b132b] text-amber-300 font-mono text-[9px] px-1 rounded">
                          81.2%?
                        </span>
                      </div>
                    )}
                    {venue.id === 'venue-3' && (
                      <div className="absolute right-1/4 top-1/4 w-10 h-12 border-2 border-red-500 bg-red-500/20 rounded-xs">
                        <span className="absolute -top-3.5 left-0 bg-[#0b132b] text-red-300 font-mono text-[9px] px-1 rounded">
                          Occluded
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Top Status Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-[#0b132b]/85 backdrop-blur-md px-2 py-0.5 rounded-full text-white">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                      <span className="font-mono text-[10px] font-semibold tracking-wider">
                        {venue.rtspFeed}
                      </span>
                    </div>
                    <div className="bg-[#0b132b]/75 backdrop-blur-md px-2 py-0.5 rounded text-[#cbdbf5] font-mono text-[10px]">
                      {venue.fps} FPS • {venue.resolution}
                    </div>
                  </div>

                  {/* Bottom Feed Metadata Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0b132b] via-[#0b132b]/80 to-transparent p-3 pt-6 flex items-end justify-between text-white">
                    <div>
                      <div className="text-[12px] font-semibold text-white">{venue.name}</div>
                      <div className="font-mono text-[10px] text-[#cbdbf5]">Edge: {venue.edgeNode}</div>
                    </div>
                    <span className="bg-[#006e4b]/80 text-[#6ffbbe] px-2 py-0.5 rounded text-[10px] font-semibold">
                      {venue.density}% Density
                    </span>
                  </div>
                </div>

                {/* Session Details Body */}
                <div className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#4f46e5] tracking-wide uppercase">
                        {venue.code}
                      </span>
                      <h3 className="text-[14px] font-bold text-[#0b1c30]">{venue.subject}</h3>
                      <p className="text-[12px] text-[#565d79]">{venue.instructor}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[16px] font-bold text-[#0b1c30]">
                        {venue.presentCount}
                        <span className="text-[#565d79] text-[13px] font-normal">/{venue.enrolledCount}</span>
                      </span>
                      <span className="block text-[11px] text-[#006e4b] font-semibold">
                        {venue.density}% present
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden flex">
                    <div className="bg-[#006e4b] h-full" style={{ width: `${venue.density}%` }}></div>
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: `${100 - venue.density}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#565d79]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#565d79]" /> {venue.time}
                    </span>
                    <button
                      onClick={() => onInspectVenue(venue.id)}
                      className="text-[#4f46e5] hover:text-[#3525cd] font-semibold flex items-center gap-0.5 hover:underline"
                    >
                      Inspect Feed <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Biometric Comparison Mini Widget */}
          <div className="bg-white rounded-xl p-4 border border-[#e5eeff] shadow-xs mt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#3525cd]" />
                <span className="text-[14px] font-bold text-[#0b1c30]">Recent Edge Match Sample</span>
              </div>
              <span className="font-mono text-[11px] text-[#565d79]">Inference Latency: 14.2ms</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between bg-[#eff4ff]/60 border border-[#dce9ff]/60 rounded-xl p-3 gap-4">
              <div className="flex items-center gap-4">
                {/* Enrolled Baseline */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-lg bg-white overflow-hidden relative shadow-xs border border-[#cbd5e1]">
                    <img
                      className="w-full h-full object-cover"
                      alt="Enrolled baseline"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHqrnT8TPuLFvwSLFFUnfT0Pmq-UUJ-lLd-VMI497egewW5ALYDxFCPdriOEbp1eY8cKy3VQd61ikTc_AZ_Byv2gmr_rA97GQU4WqrRKcnF_opfmwOCS14_TpomRLdP32MxA8xGETFGlq-vKej5JcoV-rNEjbDcAgyXih2VRZKVlP0FRvjSkWso0XvMxaTumWCqEDRnPB8RyrW4TeGe4H-N31wpLbeHd95iVjj-F9tPtiNDmhA1kVi4g"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-[#0b132b]/80 text-[8px] text-center text-white py-0.5 font-mono">
                      ENROLLED
                    </span>
                  </div>
                  <span className="text-[9px] text-[#565d79] mt-1 font-mono">ID #590012832</span>
                </div>

                <div className="flex flex-col items-center text-[#3525cd]">
                  <span className="font-mono text-[10px] font-bold text-[#006e4b]">0.994 SIM</span>
                  <ChevronRight className="w-4 h-4" />
                </div>

                {/* Live Match Crop */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-lg bg-[#0b132b] overflow-hidden relative shadow-xs border border-[#10b981]">
                    <img
                      className="w-full h-full object-cover"
                      alt="Live match crop"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2dEvEL-Do7wPNHrNv5RDa6j5OID2V20v5DRAN1T6eWkHXxJedWFBMENpyGejcFysqZNZc2IzMoQyh8MpMatpOrhNkKzQ11G9X3Gw17hxjfBYOgiL-2sIvnjlsgXFnHkJvlMp8H9g5D0KbpHA7aBsow0uQoOLhyBxgCpmWs9HeGzrUbPLq-AxFyZBzQ9oBBZ4WeNr0RyHx_J5dZPc-7qRhMb9AuEQYqtC7b9b4talvcz1my9zahMEjVw"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-[#006e4b] text-[8px] text-center text-white py-0.5 font-mono font-bold">
                      99.4% MATCH
                    </span>
                  </div>
                  <span className="text-[9px] text-[#565d79] mt-1 font-mono">Hall A • 10:24:18</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-[#0b1c30]">Yatish Sharma</span>
                  <span className="text-[11px] text-[#565d79]">B.Tech Computer Science — Sem 5</span>
                  <span className="font-mono text-[11px] text-[#006e4b] flex items-center gap-1 mt-0.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Automated Liveness Confirmed
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectStudentForTelemetry?.('590012832');
                  onNavigate('live-capture');
                }}
                className="px-4 py-2 rounded-lg bg-white border border-[#dce9ff] hover:bg-[#e5eeff] text-[#0b1c30] text-[12px] font-semibold transition-colors shadow-xs shrink-0"
              >
                View Verification Profile
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Event Stream + Academic Policy */}
        <div className="flex flex-col gap-4">
          {/* Live Event Stream Card */}
          <div className="bg-white rounded-xl shadow-xs border border-[#e5eeff] flex flex-col h-full">
            <div className="p-4 flex items-center justify-between border-b border-[#e5eeff]">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#4f46e5]" />
                <h2 className="text-[14px] font-bold text-[#0b1c30]">Live Event Stream</h2>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" title="Socket Connected"></span>
            </div>

            {/* Stream List */}
            <div className="flex flex-col divide-y divide-[#eff4ff] overflow-y-auto max-h-[460px]">
              {/* Event 1: Verified */}
              <div className="p-3.5 flex items-start gap-3 hover:bg-[#eff4ff]/40 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#67f4b7]/20 text-[#005338] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#0b1c30] truncate">Anmol Bhatia Verified</span>
                    <span className="font-mono text-[10px] text-[#565d79]">10:27:12</span>
                  </div>
                  <p className="text-[11px] text-[#565d79] truncate">Session AI301 • Node-Beta-04</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-[#67f4b7]/20 text-[#005338] font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                      99.2% SIMILARITY
                    </span>
                    <span className="text-[#565d79] text-[10px]">• Desk #14</span>
                  </div>
                </div>
              </div>

              {/* Event 2: Review Required (Interactive Confirm / Reject!) */}
              <div className="p-3.5 flex items-start gap-3 bg-amber-50/50 hover:bg-amber-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#0b1c30] truncate">Review Required</span>
                    <span className="font-mono text-[10px] text-[#565d79]">10:25:40</span>
                  </div>
                  <p className="text-[11px] text-[#565d79] truncate">Session CS402 • Hall A</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-amber-100 text-amber-900 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                      78.4% MATCH
                    </span>
                    <span className="text-[#565d79] text-[10px]">• Yash Singhal</span>
                  </div>

                  {reviewRequiredHandled ? (
                    <div className="mt-2 text-[11px] font-semibold text-[#005338] bg-[#67f4b7]/20 px-2 py-1 rounded">
                      {reviewRequiredHandled}
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-1.5">
                      <button
                        onClick={() => {
                          setReviewRequiredHandled('Marked Present (Instructor Override)');
                          onShowToast('Yash Singhal confirmed present in Hall A', 'check');
                        }}
                        className="px-2.5 py-1 bg-[#4f46e5] text-white rounded text-[11px] font-bold hover:bg-[#3525cd] flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3 h-3" /> Confirm
                      </button>
                      <button
                        onClick={() => {
                          setReviewRequiredHandled('Rejected (Marked Absent)');
                          onShowToast('Match rejected for Yash Singhal', 'x');
                        }}
                        className="px-2.5 py-1 bg-[#eff4ff] text-[#565d79] rounded text-[11px] font-bold hover:bg-[#dce9ff] flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Event 3: Verified */}
              <div className="p-3.5 flex items-start gap-3 hover:bg-[#eff4ff]/40 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#67f4b7]/20 text-[#005338] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#0b1c30] truncate">Sarah Jenkins Verified</span>
                    <span className="font-mono text-[10px] text-[#565d79]">10:24:02</span>
                  </div>
                  <p className="text-[11px] text-[#565d79] truncate">Session MATH210 • Aud-B</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-[#67f4b7]/20 text-[#005338] font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                      97.8% SIMILARITY
                    </span>
                    <span className="text-[#565d79] text-[10px]">• Roster Matched</span>
                  </div>
                </div>
              </div>

              {/* Event 4: Unregistered Subject Alert */}
              <div className="p-3.5 flex items-start gap-3 hover:bg-red-50/40 transition-colors">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-red-700 truncate">Unregistered Subject</span>
                    <span className="font-mono text-[10px] text-[#565d79]">10:21:18</span>
                  </div>
                  <p className="text-[11px] text-[#565d79] truncate">Auditorium B • Node-Gamma-02</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-red-100 text-red-700 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                      NO TEMPLATE FOUND
                    </span>
                  </div>
                </div>
              </div>

              {/* Event 5: RTSP Buffer Sync */}
              <div className="p-3.5 flex items-start gap-3 hover:bg-[#eff4ff]/40 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#e5eeff] text-[#3525cd] flex items-center justify-center shrink-0 mt-0.5">
                  <Radio className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#0b1c30] truncate">RTSP Buffer Synchronized</span>
                    <span className="font-mono text-[10px] text-[#565d79]">10:19:00</span>
                  </div>
                  <p className="text-[11px] text-[#565d79] truncate">Frame drops: 0.00% across all 4 venues</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#eff4ff]/60 text-center border-t border-[#e5eeff]">
              <button
                onClick={() => onNavigate('review-queue')}
                className="text-[11px] text-[#4f46e5] hover:underline font-bold"
              >
                View Complete Audit Stream (842 records) →
              </button>
            </div>
          </div>

          {/* Academic Policy & Consent Card */}
          <div className="bg-white rounded-xl p-4 border border-[#e5eeff] shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#565d79] font-bold">
                FERPA & Consent Compliance
              </span>
              <span className="bg-[#67f4b7]/20 text-[#005338] px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
                100% AUDITED
              </span>
            </div>
            <p className="text-[11px] text-[#565d79] leading-relaxed">
              Biometric vector hashes are dynamically mapped in RAM and flushed after each 90-minute class session.
              Raw image frames are discarded per academic privacy policy.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-[#eff4ff] text-[11px]">
              <span className="text-[#0b1c30] font-semibold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#006e4b]" /> Retained: 0 Days
              </span>
              <button
                onClick={() => onNavigate('settings')}
                className="text-[#4f46e5] hover:underline font-semibold"
              >
                Policy Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Immediate Roster Verification Status Table */}
      <div className="bg-white rounded-xl shadow-xs border border-[#e5eeff] overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5eeff]">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-[15px] font-bold text-[#0b1c30]">Immediate Roster Verification Status</h2>
            <div className="flex items-center gap-1.5 bg-[#eff4ff] px-3 py-1 rounded-lg border border-[#dce9ff]">
              <span className="text-[11px] text-[#565d79]">Filtering:</span>
              <span className="text-[11px] text-[#3525cd] font-bold">
                Hall A — CS402 (Advanced Neural Networks)
              </span>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#565d79]" />
            <input
              type="text"
              value={searchRoster}
              onChange={(e) => setSearchRoster(e.target.value)}
              placeholder="Filter student name, ID or seat..."
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[12px] placeholder:text-[#565d79]/60 focus:outline-none focus:bg-white border border-transparent focus:border-[#4f46e5] transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eff4ff]/60 text-[#565d79] text-[11px] font-semibold uppercase tracking-wider border-b border-[#e5eeff]">
                <th className="py-2.5 px-4">Seat / ID</th>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4">Programme</th>
                <th className="py-2.5 px-4">Consent Record</th>
                <th className="py-2.5 px-4">Biometric Confidence</th>
                <th className="py-2.5 px-4">Check-in Timestamp</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eff4ff] text-[12px] text-[#0b1c30]">
              {filteredRoster.map((student) => (
                <tr key={student.id} className="hover:bg-[#eff4ff]/40 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-[#565d79]">
                    {student.seat} • {student.id}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#eff4ff] text-[#3525cd] flex items-center justify-center text-[10px] font-bold border border-[#dce9ff]">
                        {student.initials}
                      </div>
                      <span className="font-semibold">{student.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-[#565d79]">{student.programme}</td>
                  <td className="py-2.5 px-4">
                    <span className="bg-[#67f4b7]/20 text-[#005338] text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#006e4b]"></span> {student.consent}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          student.confidence > 90 ? 'text-[#006e4b]' : 'text-amber-800'
                        }`}
                      >
                        {student.confidence}%
                      </span>
                      <div className="w-16 bg-[#eff4ff] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${student.confidence > 90 ? 'bg-[#006e4b]' : 'bg-amber-400'}`}
                          style={{ width: `${student.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#565d79]">{student.timestamp}</td>
                  <td className="py-2.5 px-4 text-right">
                    {student.isReview ? (
                      <button
                        onClick={() => onNavigate('review-queue')}
                        className="text-[#4f46e5] hover:bg-[#eff4ff] px-2.5 py-1 rounded text-[11px] font-bold transition-colors"
                      >
                        Review
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectStudentForTelemetry?.(student.id);
                          onNavigate('live-capture');
                        }}
                        className="text-[#565d79] hover:text-[#3525cd] p-1.5 rounded hover:bg-[#eff4ff] transition-colors"
                        title="View Match Telemetry"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-4 py-2.5 bg-[#eff4ff]/60 flex items-center justify-between text-[11px] text-[#565d79]">
          <span>Showing 4 of 90 active student biometric tracks in Hall A</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-0.5 bg-white border border-[#e2e8f0] rounded text-[11px] disabled:opacity-40" disabled>
              Previous
            </button>
            <span className="font-mono px-2 text-[#0b1c30] font-bold">1 / 23</span>
            <button
              onClick={() => onShowToast('Next page loaded')}
              className="px-2 py-0.5 bg-white border border-[#e2e8f0] rounded text-[11px] hover:bg-[#eff4ff]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
