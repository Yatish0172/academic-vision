import React from 'react';
import {
  LayoutDashboard,
  Video,
  ClipboardCheck,
  Users,
  ScanFace,
  Calendar,
  BarChart3,
  Settings,
  GraduationCap
} from 'lucide-react';
import { NavigationTab } from '../types';
const LOGO_URL = '/favicon.svg';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  reviewPendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  reviewPendingCount = 0
}) => {
  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-capture' as NavigationTab, label: 'Live Capture', icon: Video, badge: '' },
    {
      id: 'review-queue' as NavigationTab,
      label: 'Review Queue',
      icon: ClipboardCheck,
      count: reviewPendingCount
    },
    { id: 'students' as NavigationTab, label: 'Students', icon: Users },
    { id: 'enrollment' as NavigationTab, label: 'Biometric Enrollment', icon: ScanFace },
    { id: 'attendance-sessions' as NavigationTab, label: 'Attendance Sessions', icon: Calendar },
    { id: 'reports' as NavigationTab, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#213145] text-[#eaf1ff] z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.12)] border-r border-[#32455e]">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[#2d3f55]">
          <img
            alt="Face Attendance Academic Vision Logo"
            className="h-8 w-auto object-contain shrink-0"
            src={LOGO_URL}
            onError={(e) => {
              // fallback if network fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-[15px] tracking-tight text-white">Face Attendance</span>
            <span className="text-[10px] text-[#c3c0ff] uppercase tracking-wider font-semibold mt-1">
              Academic Vision
            </span>
          </div>
        </div>

        {/* Institution Badge */}
        <div className="px-4 py-3">
          <div className="bg-[#2d3f55]/60 border border-[#3e536e]/40 rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#6ffbbe]" />
              <span className="text-[12px] font-medium text-[#dce9ff] tracking-tight">
                Academic attendance
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" title="Signed in"></span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 px-3 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left group ${
                  isActive
                    ? 'bg-[#4f46e5] text-white shadow-sm font-semibold'
                    : 'text-[#cbdbf5] hover:bg-[#2d3f55]/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-[#a2b5cd]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] bg-red-500/90 text-white font-bold px-1.5 py-0.5 rounded tracking-wider animate-pulse">
                    {item.badge}
                  </span>
                )}

                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Recognition engine Status Footer */}
      <div className="p-4 mb-1">
        <div className="bg-[#182433] border border-[#2d3f55] rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#a2b5cd] font-medium">Recognition engine</span>
            <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse"></span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-white font-semibold">OpenCV SFace</span>
            <span className="text-[10px] text-[#6ffbbe] bg-[#005338]/40 px-1.5 py-0.5 rounded font-mono">
              Local
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
