import React from 'react';
import { HelpCircle, X, Shield, Key, Sparkles, Sliders } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#213145] flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#e5eeff] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#3525cd] flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#0b1c30]">Academic Vision System Help</h2>
              <p className="text-[12px] text-[#565d79]">Standard Operating Procedures & Shortcuts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#565d79] hover:text-[#0b1c30] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-[13px] text-[#565d79]">
          <div className="p-3 bg-[#eff4ff]/60 rounded-xl border border-[#dce9ff] flex flex-col gap-1">
            <span className="font-bold text-[#0b1c30] flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#3525cd]" /> Cosine Decision Threshold (0.820)
            </span>
            <p className="text-[12px] leading-relaxed">
              Inferences generating cosine distance above 0.820 are instantly registered as present. Submissions between
              0.650 and 0.819 are routed to the Review Queue for human validation.
            </p>
          </div>

          <div className="p-3 bg-[#eff4ff]/60 rounded-xl border border-[#dce9ff] flex flex-col gap-1">
            <span className="font-bold text-[#0b1c30] flex items-center gap-1.5">
              <Key className="w-4 h-4 text-[#4f46e5]" /> Review Queue Keyboard Shortcuts
            </span>
            <p className="text-[12px] leading-relaxed">
              When reviewing flags in the Review Queue, press <kbd className="px-1 bg-white border rounded">A</kbd> to
              reject, <kbd className="px-1 bg-white border rounded">R</kbd> to schedule secondary rescan, or{' '}
              <kbd className="px-1 bg-white border rounded">S</kbd> to confirm verified match.
            </p>
          </div>

          <div className="p-3 bg-[#eff4ff]/60 rounded-xl border border-[#dce9ff] flex flex-col gap-1">
            <span className="font-bold text-[#0b1c30] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#006e4b]" /> FERPA Privacy Compliance
            </span>
            <p className="text-[12px] leading-relaxed">
              Student consent must be logged prior to biometric enrollment. Non-consented students are excluded from
              automated roll call and may present student ID cards.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#213145] text-white text-[12px] font-bold shadow-xs hover:bg-[#0b132b]"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
