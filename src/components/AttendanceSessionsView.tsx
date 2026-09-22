import React, { useState } from 'react';
import {
  Calendar,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  Building,
  GraduationCap
} from 'lucide-react';
import { AttendanceSession, NavigationTab } from '../types';
import { ATTENDANCE_SESSIONS } from '../data/mockData';

interface AttendanceSessionsViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const AttendanceSessionsView: React.FC<AttendanceSessionsViewProps> = ({
  onNavigate,
  onShowToast
}) => {
  const [sessions] = useState<AttendanceSession[]>(ATTENDANCE_SESSIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = sessions.filter((s) => {
    const matchesSearch =
      s.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.section.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[12px] text-[#565d79]">
            <span className="font-semibold text-[#4f46e5] uppercase tracking-wider">Historical Logs</span>
            <span>•</span>
            <span>Academic Attendance Registry</span>
          </div>
          <h1 className="text-[26px] font-bold text-[#0b1c30] tracking-tight mt-0.5">
            Classroom Attendance Sessions
          </h1>
        </div>

        <button
          onClick={() => onShowToast('Exporting master attendance ledger (CSV)...')}
          className="h-9 px-4 rounded-lg bg-white border border-[#dce9ff] text-[#0b1c30] hover:bg-[#eff4ff] text-[12px] font-bold shadow-xs transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#565d79]" />
          <span>Export All Sessions (CSV)</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl p-4 border border-[#e5eeff] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#565d79]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search course, venue or section..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[12px] placeholder:text-[#565d79]/60 focus:outline-none focus:bg-white border border-transparent focus:border-[#4f46e5]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Session Status"
            className="h-9 bg-[#eff4ff] text-[#0b1c30] text-[12px] font-semibold rounded-lg px-3 pr-8 border border-transparent focus:border-[#4f46e5]"
          >
            <option value="All">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eff4ff]/70 text-[#565d79] text-[11px] font-bold uppercase tracking-wider border-b border-[#e5eeff]">
                <th className="py-3 px-4">Session Date & Time</th>
                <th className="py-3 px-4">Course & Section</th>
                <th className="py-3 px-4">Classroom Venue</th>
                <th className="py-3 px-4">Present / Enrolled</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Verification Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eff4ff] text-[13px] text-[#0b1c30]">
              {filtered.map((s) => {
                const percentage = Math.round((s.present / s.total) * 100);
                return (
                  <tr key={s.id} className="hover:bg-[#eff4ff]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{s.date}</span>
                        <span className="text-[11px] text-[#565d79] flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {s.time}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0b1c30]">{s.course}</span>
                        <span className="text-[11px] font-mono text-[#4f46e5]">Section: {s.section}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[#565d79]">
                        <Building className="w-3.5 h-3.5 text-[#3525cd]" />
                        <span>{s.venue}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      {s.present} <span className="text-[#565d79] font-normal">/ {s.total}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#006e4b] text-[12px]">{percentage}%</span>
                        <div className="w-16 bg-[#cbd5e1] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#006e4b] h-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[#565d79]">{s.method}</td>

                    <td className="py-3 px-4">
                      {s.status === 'In Progress' ? (
                        <span className="bg-[#4f46e5]/10 text-[#4f46e5] font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] animate-pulse"></span> Active
                        </span>
                      ) : (
                        <span className="bg-[#67f4b7]/20 text-[#005338] font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (s.status === 'In Progress') {
                            onNavigate('live-capture');
                          } else {
                            onShowToast(`Downloading audit pack for session ${s.id}`);
                          }
                        }}
                        className="text-[#4f46e5] hover:underline font-bold text-[12px]"
                      >
                        {s.status === 'In Progress' ? 'Inspect' : 'Download'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
