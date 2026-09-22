import React from 'react';
import {
  ReceiptText,
  ShieldCheck,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { AUDIT_LOGS } from '../data/mockData';

interface AuditLogModalProps {
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ onClose, onShowToast }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-[#213145] flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#e5eeff] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#3525cd] flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-[#0b1c30]">Cryptographic Audit Log</h2>
                <span className="bg-[#67f4b7]/20 text-[#005338] text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  Immutable Hash-Chain
                </span>
              </div>
              <p className="text-[12px] text-[#565d79]">All instructor overrides and AI decisions are tamper-proof</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-[#565d79] hover:text-[#0b1c30] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Log Entries List */}
        <div className="flex flex-col divide-y divide-[#eff4ff] border border-[#e5eeff] rounded-xl overflow-hidden">
          {AUDIT_LOGS.map((log) => (
            <div key={log.id} className="p-3.5 flex items-start gap-3 hover:bg-[#eff4ff]/30 transition-colors">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] shrink-0 mt-0.5 ${
                  log.status === 'SUCCESS'
                    ? 'bg-[#67f4b7]/20 text-[#005338]'
                    : log.status === 'ALERT'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-[#eff4ff] text-[#3525cd]'
                }`}
              >
                {log.status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : log.status === 'ALERT' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[13px] text-[#0b1c30]">{log.action}</span>
                  <span className="font-mono text-[11px] text-[#565d79]">{log.timestamp}</span>
                </div>
                <p className="text-[12px] text-[#565d79] mt-0.5">{log.details}</p>
                <div className="flex items-center justify-between mt-1 text-[10px] text-[#565d79] font-mono">
                  <span>Actor: {log.actor}</span>
                  <span className="text-[#3525cd]">{log.hash}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-[#565d79] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#006e4b]" /> FERPA Title 34 CFR Part 99 Compliant
          </span>
          <button
            onClick={() => onShowToast('Exported audit certificate bundle with signatures.')}
            className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-[12px] font-bold hover:bg-[#3525cd] shadow-xs flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Signed Audit Bundle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
