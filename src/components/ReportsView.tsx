import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

interface ReportsViewProps {
  onShowToast: (msg: string, icon?: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onShowToast }) => {
  const weeklyTrends = [
    { week: 'Week 1', rate: 94.2, flagged: 1.2 },
    { week: 'Week 2', rate: 93.8, flagged: 1.4 },
    { week: 'Week 3', rate: 91.5, flagged: 2.1 },
    { week: 'Week 4', rate: 95.0, flagged: 0.9 },
    { week: 'Week 5', rate: 92.4, flagged: 1.8 },
    { week: 'Week 6', rate: 93.1, flagged: 1.5 },
    { week: 'Week 7 (Current)', rate: 92.6, flagged: 1.3 }
  ];

  const courseStats = [
    { code: 'CS402', name: 'Advanced Neural Networks', enrolled: 90, avgAttendance: '93.3%', reviews: 4 },
    { code: 'AI301', name: 'Computer Vision Lab', enrolled: 45, avgAttendance: '94.8%', reviews: 1 },
    { code: 'MATH210', name: 'Linear Algebra & Tensors', enrolled: 120, avgAttendance: '89.2%', reviews: 8 },
    { code: 'ECE512', name: 'Embedded AI & Edge Robotics', enrolled: 30, avgAttendance: '96.0%', reviews: 0 }
  ];

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-[#565d79]">
            <span className="font-semibold text-[#4f46e5] uppercase tracking-wider">Executive Intelligence</span>
            <span>•</span>
            <span>Academic Performance Metrics</span>
          </div>
          <h1 className="text-[26px] font-bold text-[#0b1c30] tracking-tight mt-0.5">
            Attendance & Compliance Reports
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onShowToast('Generating Institutional Accreditation PDF Report...')}
            className="h-9 px-4 rounded-lg bg-white border border-[#dce9ff] text-[#0b1c30] hover:bg-[#eff4ff] text-[12px] font-bold shadow-xs transition-all flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-[#4f46e5]" />
            <span>Accreditation PDF</span>
          </button>
          <button
            onClick={() => onShowToast('Exporting aggregated term CSV...')}
            className="h-9 px-4 rounded-lg bg-[#4f46e5] hover:bg-[#3525cd] text-white text-[12px] font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Raw Data</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-xs">
          <span className="text-[11px] font-bold text-[#565d79] uppercase tracking-wider">
            Semester Mean Attendance
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[32px] font-bold text-[#0b1c30]">93.2%</span>
            <span className="text-[12px] text-[#006e4b] font-bold">+1.8% vs Fall 2024</span>
          </div>
          <p className="text-[11px] text-[#565d79] mt-1">Across 18 lecture halls & computing clusters</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-xs">
          <span className="text-[11px] font-bold text-[#565d79] uppercase tracking-wider">
            Computer Vision Accuracy
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[32px] font-bold text-[#006e4b]">99.4%</span>
            <span className="text-[12px] text-[#565d79] font-mono">FAR &lt; 0.001%</span>
          </div>
          <p className="text-[11px] text-[#565d79] mt-1">False Acceptance Rate meets NIST standard</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-xs">
          <span className="text-[11px] font-bold text-[#565d79] uppercase tracking-wider">
            Human Review Resolution Time
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[32px] font-bold text-[#3525cd]">1.4 min</span>
            <span className="text-[12px] text-[#006e4b] font-bold">Fast SLA</span>
          </div>
          <p className="text-[11px] text-[#565d79] mt-1">98% of flagged discrepancies resolved within session</p>
        </div>
      </div>

      {/* Visual Chart Mockup using Tailwind Bars */}
      <div className="bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-[#0b1c30]">Weekly Term Trend Analysis</h3>
            <p className="text-[12px] text-[#565d79]">Overall attendance rate percentage week-by-week</p>
          </div>
          <span className="text-[11px] font-mono text-[#006e4b] font-bold bg-[#67f4b7]/20 px-2.5 py-1 rounded-full">
            Target: 90.0% Minimum
          </span>
        </div>

        {/* Bar Chart Visualization */}
        <div className="pt-6 pb-2 grid grid-cols-7 gap-4 items-end h-56 border-b border-[#eff4ff]">
          {weeklyTrends.map((w) => (
            <div key={w.week} className="flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[11px] font-mono font-bold text-[#0b1c30] opacity-0 group-hover:opacity-100 transition-opacity">
                {w.rate}%
              </span>
              <div className="w-full max-w-[48px] bg-[#eff4ff] rounded-t-lg h-full flex items-end overflow-hidden p-1">
                <div
                  className="w-full bg-[#4f46e5] rounded-t group-hover:bg-[#3525cd] transition-all"
                  style={{ height: `${(w.rate - 80) * 5}%` }}
                ></div>
              </div>
              <span className="text-[11px] text-[#565d79] font-medium truncate w-full text-center">
                {w.week.split(' ')[0]} {w.week.split(' ')[1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#e5eeff]">
          <h3 className="text-[16px] font-bold text-[#0b1c30]">Course-Level Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eff4ff]/70 text-[#565d79] text-[11px] font-bold uppercase tracking-wider border-b border-[#e5eeff]">
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Enrolled</th>
                <th className="py-3 px-4">Average Attendance</th>
                <th className="py-3 px-4">Flagged Reviews</th>
                <th className="py-3 px-4 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eff4ff] text-[13px] text-[#0b1c30]">
              {courseStats.map((c) => (
                <tr key={c.code} className="hover:bg-[#eff4ff]/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#4f46e5]">{c.code}</span> — {c.name}
                  </td>
                  <td className="py-3 px-4 font-mono">{c.enrolled} students</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#006e4b]">{c.avgAttendance}</td>
                  <td className="py-3 px-4 font-mono">{c.reviews} flags</td>
                  <td className="py-3 px-4 text-right">
                    <span className="bg-[#67f4b7]/20 text-[#005338] text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Certified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
