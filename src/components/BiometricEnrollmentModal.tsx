import React, { useState } from 'react';
import {
  ScanFace,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Camera,
  X,
  ChevronRight,
  Zap,
  Check
} from 'lucide-react';
import { Student } from '../types';

interface BiometricEnrollmentModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: (updatedStudent: Student) => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const BiometricEnrollmentModal: React.FC<BiometricEnrollmentModalProps> = ({
  student,
  onClose,
  onSuccess,
  onShowToast
}) => {
  const [currentStep, setCurrentStep] = useState<number>(2); // 1: Identity, 2: Capture, 3: Quality, 4: Compiled
  const [currentAngleIndex, setCurrentAngleIndex] = useState<number>(2); // 0 to 4
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  const angles = [
    { title: 'Frontal Neutral', instruction: 'Look directly at camera with neutral expression', done: true },
    { title: 'Turn Left 15°', instruction: 'Slightly turn head to the left', done: true },
    { title: 'Turn Right 15°', instruction: 'Slightly turn head to the right', done: false },
    { title: 'Liveness Smile', instruction: 'Natural brief smile for dynamic micro-expression', done: false },
    { title: 'Tilt Up 10°', instruction: 'Slightly tilt chin upwards', done: false }
  ];

  const handleCaptureNextAngle = () => {
    if (currentAngleIndex < angles.length - 1) {
      setCurrentAngleIndex((prev) => prev + 1);
      onShowToast(`Captured Angle ${currentAngleIndex + 1}/5: ${angles[currentAngleIndex].title}`, 'check');
    } else {
      setCurrentAngleIndex(angles.length);
      setCurrentStep(3);
      onShowToast('All 5 angles captured! Validating 3D depth and liveness vectors...');
    }
  };

  const handleCompileAndDeploy = () => {
    setIsCompiling(true);
    setTimeout(() => {
      setIsCompiling(false);
      setCurrentStep(4);
      onShowToast('Biometric vector compiled and propagated across all 12 edge nodes!', 'sparkles');

      const updated: Student = {
        ...student,
        template: 'Ready (128-d)',
        vectorHash: 'sha256-8a91f...ec31',
        status: 'Active',
        consent: 'RECORDED'
      };

      setTimeout(() => {
        onSuccess(updated);
        onClose();
      }, 1400);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-[#213145] flex flex-col gap-5 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5eeff] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3525cd] text-white flex items-center justify-center shadow-sm">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-[#0b1c30]">Guided Biometric Enrollment</h2>
                <span className="text-[11px] font-mono bg-[#eff4ff] text-[#3525cd] px-2 py-0.5 rounded font-bold">
                  ArcFace 128-d
                </span>
              </div>
              <p className="text-[12px] text-[#565d79]">
                Subject: <span className="font-bold text-[#0b1c30]">{student.name}</span> (ID: #{student.id}) •{' '}
                {student.programme}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-[#565d79] hover:text-[#0b1c30] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, label: 'Identity & Consent' },
            { step: 2, label: 'Multi-Angle Capture' },
            { step: 3, label: 'Quality & Liveness' },
            { step: 4, label: 'Node Compilation' }
          ].map((s) => {
            const isDone = currentStep > s.step;
            const isCurrent = currentStep === s.step;

            return (
              <div
                key={s.step}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-[12px] font-semibold transition-all ${
                  isDone
                    ? 'bg-[#67f4b7]/15 border-[#006e4b]/30 text-[#005338]'
                    : isCurrent
                    ? 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-xs'
                    : 'bg-[#eff4ff] text-[#565d79] border-transparent'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isDone ? 'bg-[#006e4b] text-white' : isCurrent ? 'bg-white text-[#4f46e5]' : 'bg-[#cbd5e1] text-white'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" /> : s.step}
                </div>
                <span className="truncate">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Main Enrollment Workspace */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Viewport with Face Reticle (7 cols) */}
            <div className="md:col-span-7 flex flex-col gap-3">
              <div className="relative bg-[#070e1d] rounded-2xl overflow-hidden border border-[#213145] aspect-4/3 flex items-center justify-center shadow-inner">
                {/* Real-time live camera frame */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${student.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDasXbpJgp1VLFTqom-y2JGzyZ8pthQhPhW35BVPY9h2dyp96NZQaJYRkNzLvjZlR-ZIizM_5s8576vPNS58mNr8xiL4hOY4O67lJ4_j4izE7vmW5TlU8jM3R4tc_-xdlBmeZ2K_MWFxO8nagEWq8L2921lE_muzRkM4f8u9uf3WSJa5I_t3px_X4EfGNUH8zdT9OS838AS4C3XtpMLTMtc3fANKU0-x2vsEl3qvkeoKP10Nnt6plOTPQ'}')`
                  }}
                />

                {/* SVG Face Oval Alignment Reticle */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300">
                  {/* Outer alignment oval */}
                  <ellipse
                    cx="200"
                    cy="145"
                    rx="85"
                    ry="115"
                    fill="none"
                    stroke="#6ffbbe"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                  {/* Eye crosshairs */}
                  <line x1="160" y1="125" x2="185" y2="125" stroke="#6ffbbe" strokeWidth="2" />
                  <line x1="215" y1="125" x2="240" y2="125" stroke="#6ffbbe" strokeWidth="2" />
                  {/* Center vertical guide */}
                  <line x1="200" y1="90" x2="200" y2="200" stroke="#6ffbbe" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                </svg>

                {/* Reticle HUD Diagnostics */}
                <div className="absolute top-3 left-3 bg-[#0b132b]/85 px-2.5 py-1 rounded text-white font-mono text-[10px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping"></span>
                  <span>Yaw +12.4° • Pitch -2.1°</span>
                </div>

                <div className="absolute top-3 right-3 bg-[#0b132b]/85 px-2.5 py-1 rounded text-[#6ffbbe] font-mono text-[10px]">
                  480 Lux [Optimal] • 60 FPS
                </div>

                {/* Bottom angle prompt */}
                <div className="absolute bottom-3 inset-x-3 bg-[#0b132b]/90 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-white flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#6ffbbe]">
                      Angle {currentAngleIndex + 1}/5: {angles[currentAngleIndex]?.title || 'Done'}
                    </span>
                    <span className="text-[10px] text-[#cbdbf5]">
                      {angles[currentAngleIndex]?.instruction || 'Capture complete'}
                    </span>
                  </div>
                  <button
                    onClick={handleCaptureNextAngle}
                    className="h-8 px-3 rounded-lg bg-[#4f46e5] hover:bg-[#3525cd] text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" /> Capture
                  </button>
                </div>
              </div>

              {/* Angle steps row */}
              <div className="grid grid-cols-5 gap-1 text-center">
                {angles.map((a, i) => (
                  <div
                    key={a.title}
                    className={`p-1.5 rounded-lg border text-[10px] font-medium ${
                      i < currentAngleIndex
                        ? 'bg-[#006e4b]/10 text-[#006e4b] border-[#006e4b]/30'
                        : i === currentAngleIndex
                        ? 'bg-[#eff4ff] text-[#4f46e5] border-[#4f46e5] font-bold ring-1 ring-[#4f46e5]'
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                    {i < currentAngleIndex ? '✓ ' : ''}
                    {a.title.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Vector Diagnostics & Quality Scores (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between gap-4">
              <div className="bg-[#eff4ff]/60 rounded-2xl p-4 border border-[#dce9ff] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#0b1c30]">Vector Quality Telemetry</span>
                  <span className="text-[11px] font-mono text-[#006e4b] font-bold">98% Overall</span>
                </div>

                {/* Score Meters */}
                <div className="flex flex-col gap-2.5 text-[11px]">
                  <div>
                    <div className="flex justify-between text-[#565d79] mb-1">
                      <span>Facial Sharpness</span>
                      <span className="font-mono font-bold text-[#0b1c30]">97%</span>
                    </div>
                    <div className="w-full bg-[#cbd5e1] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#006e4b] h-full" style={{ width: '97%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#565d79] mb-1">
                      <span>Lighting & Lux</span>
                      <span className="font-mono font-bold text-[#0b1c30]">95%</span>
                    </div>
                    <div className="w-full bg-[#cbd5e1] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#006e4b] h-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#565d79] mb-1">
                      <span>Occlusion Free</span>
                      <span className="font-mono font-bold text-[#0b1c30]">100%</span>
                    </div>
                    <div className="w-full bg-[#cbd5e1] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#006e4b] h-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#565d79] mb-1">
                      <span>Feature Symmetry</span>
                      <span className="font-mono font-bold text-[#0b1c30]">99%</span>
                    </div>
                    <div className="w-full bg-[#cbd5e1] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#006e4b] h-full" style={{ width: '99%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-[#e2e8f0] text-[11px] text-[#565d79] flex items-center gap-2 mt-1">
                  <ShieldCheck className="w-4 h-4 text-[#006e4b] shrink-0" />
                  <span>3D depth anti-spoofing certified. Physical print & screen replay attack prevented.</span>
                </div>
              </div>

              {/* Action */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setCurrentAngleIndex(5);
                    setCurrentStep(3);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#3525cd] text-white font-bold text-[13px] shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Proceed to Quality Gate</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Quality & Liveness confirmation */}
        {currentStep === 3 && (
          <div className="flex flex-col items-center justify-center p-8 gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#67f4b7]/20 text-[#005338] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-[20px] font-bold text-[#0b1c30]">All 5 Biometric Angles Verified</h3>
              <p className="text-[13px] text-[#565d79] mt-1 max-w-md">
                128-dimensional ArcFace vector tensor generated with 0.941 normalized density. Ready for distribution to
                edge inference nodes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl bg-white border border-[#cbd5e1] text-[#565d79] text-[13px] font-semibold"
              >
                Re-capture Angles
              </button>
              <button
                onClick={handleCompileAndDeploy}
                disabled={isCompiling}
                className="px-6 py-2.5 rounded-xl bg-[#006e4b] hover:bg-[#005338] text-white font-bold text-[13px] shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isCompiling ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Propagating to 12 Nodes...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Compile & Deploy Vector</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Successfully Compiled celebration */}
        {currentStep === 4 && (
          <div className="flex flex-col items-center justify-center p-8 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#006e4b] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-[20px] font-bold text-[#0b1c30]">Vector Successfully Deployed!</h3>
            <p className="text-[13px] text-[#565d79] max-w-md">
              {student.name} (# {student.id}) is now active in the institutional biometric registry. Real-time RTSP
              cameras will automatically recognize this student.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
