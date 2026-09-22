import React from 'react';
import { Calendar, ReceiptText, HelpCircle, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenAuditLog: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuditLog, onOpenHelp }) => {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/95 backdrop-blur-xl border-b border-[#e5eeff] shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-40 flex items-center justify-between px-6">
      {/* Left items */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[#0b1c30]">
          <Calendar className="w-4 h-4 text-[#565d79]" />
          <span className="text-[13px] font-semibold text-[#0b1c30]">Fall Semester 2025 - Week 7</span>
        </div>

        <div className="h-4 w-px bg-[#c7c4d8]/50 hidden sm:block"></div>

        <div className="hidden md:flex items-center gap-2 bg-[#006e4b]/10 border border-[#006e4b]/20 px-3 py-1 rounded-full">
          <span className="h-2 w-2 rounded-full bg-[#006e4b] animate-pulse"></span>
          <span className="font-mono text-[11px] font-semibold text-[#005338]">
            3 Feeds Active • 99.4% Inference
          </span>
        </div>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenAuditLog}
          className="p-2 text-[#565d79] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-lg transition-colors flex items-center justify-center relative group"
          title="Cryptographic Audit Log"
        >
          <ReceiptText className="w-4 h-4" />
          <span className="sr-only">Audit Log</span>
          <span className="absolute -bottom-8 right-0 bg-[#213145] text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            System Audit Log
          </span>
        </button>

        <button
          onClick={onOpenHelp}
          className="p-2 text-[#565d79] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-lg transition-colors flex items-center justify-center relative group"
          title="Help & Documentation"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="sr-only">Help</span>
          <span className="absolute -bottom-8 right-0 bg-[#213145] text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            FERPA & CV Docs
          </span>
        </button>

        <div className="h-6 w-px bg-[#c7c4d8]/50"></div>

        {/* User profile */}
        <div className="flex items-center gap-2.5 bg-[#eff4ff] border border-[#dce9ff] px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-[#e5eeff] transition-colors">
          <div className="flex flex-col text-right leading-none">
            <span className="text-[12px] font-semibold text-[#0b1c30]">Prof. Alex Mercer</span>
            <span className="text-[10px] text-[#565d79] mt-0.5 font-medium">AI & ML Admin</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#3525cd] text-white flex items-center justify-center shadow-xs font-semibold text-[11px]">
            AM
          </div>
        </div>
      </div>
    </header>
  );
};
