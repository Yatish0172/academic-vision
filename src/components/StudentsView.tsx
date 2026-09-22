import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  FileCheck,
  Edit2,
  ScanFace,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Fingerprint,
  HardDrive,
  Download,
  Filter,
  Check,
  X
} from 'lucide-react';
import { Student } from '../types';
import { INITIAL_STUDENTS } from '../data/mockData';

interface StudentsViewProps {
  onStartEnrollment: (student: Student) => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  onStartEnrollment,
  onShowToast
}) => {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [consentFilter, setConsentFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalStudent, setEditModalStudent] = useState<Student | null>(null);
  const [deactivateStudent, setDeactivateStudent] = useState<Student | null>(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  // New student form state
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    id: '',
    name: '',
    email: '',
    programme: 'B.Tech CSE',
    semester: 1,
    section: '1',
    consent: 'RECORDED',
    template: 'Not enrolled',
    status: 'Active'
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredStudents.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.id || !newStudent.name) {
      onShowToast('Please provide Student ID and Name');
      return;
    }

    const created: Student = {
      id: newStudent.id,
      name: newStudent.name,
      email: newStudent.email || `${newStudent.name.toLowerCase().replace(/\s+/g, '.')}@academic.edu`,
      programme: newStudent.programme || 'B.Tech CSE',
      semester: Number(newStudent.semester) || 1,
      section: newStudent.section || '1',
      consent: newStudent.consent as 'RECORDED' | 'NOT_RECORDED' | 'WITHDRAWN',
      template: 'Not enrolled',
      status: 'Active',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDasXbpJgp1VLFTqom-y2JGzyZ8pthQhPhW35BVPY9h2dyp96NZQaJYRkNzLvjZlR-ZIizM_5s8576vPNS58mNr8xiL4hOY4O67lJ4_j4izE7vmW5TlU8jM3R4tc_-xdlBmeZ2K_MWFxO8nagEWq8L2921lE_muzRkM4f8u9uf3WSJa5I_t3px_X4EfGNUH8zdT9OS838AS4C3XtpMLTMtc3fANKU0-x2vsEl3qvkeoKP10Nnt6plOTPQ'
    };

    setStudents([created, ...students]);
    setAddModalOpen(false);
    onShowToast(`Enrolled student ${created.name} (#${created.id}) in SIS registry`, 'check');
  };

  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalStudent) return;
    setStudents((prev) =>
      prev.map((s) => (s.id === editModalStudent.id ? editModalStudent : s))
    );
    setEditModalStudent(null);
    onShowToast(`Updated student profile for ${editModalStudent.name}`, 'check');
  };

  const handleConfirmDeactivate = () => {
    if (!deactivateStudent) return;
    setStudents((prev) =>
      prev.map((s) =>
        s.id === deactivateStudent.id
          ? { ...s, status: 'Inactive', template: 'Purged from edge', consent: 'WITHDRAWN' }
          : s
      )
    );
    setDeactivateStudent(null);
    onShowToast(`Purged biometric vector embeddings from all 12 edge nodes for ID #${deactivateStudent.id}`);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.includes(searchQuery) ||
      s.programme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (programmeFilter !== 'All' && !s.programme.includes(programmeFilter)) return false;
    if (semesterFilter !== 'All' && s.semester.toString() !== semesterFilter) return false;
    if (consentFilter !== 'All' && s.consent !== consentFilter) return false;

    return true;
  });

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[12px] text-[#565d79]">
            <span className="font-semibold text-[#4f46e5] uppercase tracking-wider">
              Student Biometric Registry
            </span>
            <span>•</span>
            <span>Institutional FERPA-Compliant Identity Management</span>
          </div>
          <h1 className="text-[26px] font-bold text-[#0b1c30] tracking-tight mt-0.5">
            Biometric Enrolled Students
          </h1>
        </div>

        {/* Top Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setConsentModalOpen(true)}
            className="h-9 px-4 rounded-lg bg-white border border-[#dce9ff] text-[#0b1c30] hover:bg-[#eff4ff] text-[12px] font-bold shadow-xs transition-all flex items-center gap-2"
          >
            <FileCheck className="w-3.5 h-3.5 text-[#4f46e5]" />
            <span>Consent Portal</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="h-9 px-4 rounded-lg bg-[#4f46e5] hover:bg-[#3525cd] text-white text-[12px] font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-[#e5eeff] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#565d79]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, or programme..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[12px] placeholder:text-[#565d79]/60 focus:outline-none focus:bg-white border border-transparent focus:border-[#4f46e5] transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Programme */}
          <div className="relative">
            <select
              value={programmeFilter}
              onChange={(e) => setProgrammeFilter(e.target.value)}
              aria-label="Filter by Programme"
              className="h-9 bg-[#eff4ff] text-[#0b1c30] text-[12px] font-semibold rounded-lg px-3 pr-8 border border-transparent focus:border-[#4f46e5] focus:bg-white cursor-pointer"
            >
              <option value="All">All Programmes</option>
              <option value="CSE">B.Tech CSE</option>
              <option value="AI">B.Tech AI</option>
              <option value="ECE">B.Tech ECE</option>
              <option value="Data Science">M.Tech Data Science</option>
            </select>
          </div>

          {/* Semester */}
          <div className="relative">
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              aria-label="Filter by Semester"
              className="h-9 bg-[#eff4ff] text-[#0b1c30] text-[12px] font-semibold rounded-lg px-3 pr-8 border border-transparent focus:border-[#4f46e5] focus:bg-white cursor-pointer"
            >
              <option value="All">All Semesters</option>
              <option value="1">Sem 1</option>
              <option value="2">Sem 2</option>
              <option value="3">Sem 3</option>
              <option value="5">Sem 5</option>
            </select>
          </div>

          {/* Consent Status */}
          <div className="relative">
            <select
              value={consentFilter}
              onChange={(e) => setConsentFilter(e.target.value)}
              aria-label="Filter by Consent Status"
              className="h-9 bg-[#eff4ff] text-[#0b1c30] text-[12px] font-semibold rounded-lg px-3 pr-8 border border-transparent focus:border-[#4f46e5] focus:bg-white cursor-pointer"
            >
              <option value="All">All Consent</option>
              <option value="RECORDED">RECORDED</option>
              <option value="NOT_RECORDED">NOT_RECORDED</option>
              <option value="WITHDRAWN">WITHDRAWN</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Biometric Registry Table */}
      <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eff4ff]/70 text-[#565d79] text-[11px] font-bold uppercase tracking-wider border-b border-[#e5eeff]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredStudents.length > 0 && selectedIds.length === filteredStudents.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all students"
                    className="rounded text-[#4f46e5] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Programme</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Consent Status</th>
                <th className="py-3 px-4">Biometric Template</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eff4ff] text-[13px] text-[#0b1c30]">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-[#eff4ff]/30 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => handleToggleSelect(student.id)}
                      aria-label={`Select ${student.name}`}
                      className="rounded text-[#4f46e5] focus:ring-0 cursor-pointer"
                    />
                  </td>

                  <td className="py-3 px-4 font-mono text-[12px] font-bold text-[#3525cd]">
                    {student.id}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-[#0b132b] shrink-0 border border-[#cbd5e1]">
                        {student.avatar ? (
                          <img className="w-full h-full object-cover" alt={student.name} src={student.avatar} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-[11px] font-bold">
                            {student.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0b1c30]">{student.name}</span>
                        <span className="text-[11px] text-[#565d79]">{student.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-medium text-[#565d79]">{student.programme}</td>
                  <td className="py-3 px-4 font-mono text-[#565d79]">{student.semester}</td>
                  <td className="py-3 px-4 font-mono text-[#565d79]">{student.section}</td>

                  {/* Consent Status */}
                  <td className="py-3 px-4">
                    {student.consent === 'RECORDED' ? (
                      <span className="bg-[#67f4b7]/20 text-[#005338] px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#006e4b]"></span> RECORDED
                      </span>
                    ) : student.consent === 'WITHDRAWN' ? (
                      <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> WITHDRAWN
                      </span>
                    ) : (
                      <span className="bg-[#eff4ff] text-[#565d79] px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#565d79]"></span> NOT_RECORDED
                      </span>
                    )}
                  </td>

                  {/* Biometric Template */}
                  <td className="py-3 px-4">
                    {student.template.includes('Ready') ? (
                      <span className="bg-[#006e4b]/10 text-[#005338] border border-[#006e4b]/20 px-2.5 py-0.5 rounded-md font-mono font-bold text-[11px] inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#006e4b]" /> {student.template}
                      </span>
                    ) : student.template.includes('Purged') ? (
                      <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-md font-mono font-bold text-[11px] inline-flex items-center gap-1">
                        <X className="w-3 h-3 text-red-600" /> Purged from edge
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-0.5 rounded-md font-mono text-[11px]">
                        Not enrolled
                      </span>
                    )}
                  </td>

                  {/* Action Icons */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onStartEnrollment(student)}
                        className="p-1.5 rounded text-[#4f46e5] hover:bg-[#eff4ff] transition-colors"
                        title="Enroll / Update Biometrics"
                      >
                        <ScanFace className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditModalStudent(student)}
                        className="p-1.5 rounded text-[#565d79] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors"
                        title="Edit Student Info"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeactivateStudent(student)}
                        className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                        title="Deactivate & Purge Vector"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer info */}
        <div className="p-4 bg-[#eff4ff]/60 border-t border-[#e5eeff] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#565d79] gap-2">
          <span>Showing {filteredStudents.length} of {students.length} registered students</span>
          <div className="flex items-center gap-3 font-medium">
            <span>Selected: {selectedIds.length}</span>
            {selectedIds.length > 0 && (
              <button
                onClick={() => {
                  onShowToast(`Exporting biometric compliance summary for ${selectedIds.length} students`);
                }}
                className="text-[#4f46e5] hover:underline font-bold"
              >
                Export Selected (CSV)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Insights Grid (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Consent Funnel */}
        <div className="bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#565d79] uppercase tracking-wider">
              Consent Funnel
            </span>
            <ShieldCheck className="w-4 h-4 text-[#006e4b]" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-[#0b1c30]">94.2%</span>
              <span className="text-[12px] text-[#006e4b] font-bold">Opt-In Rate</span>
            </div>
            <p className="text-[11px] text-[#565d79] mt-1">1,338/1,420 Active Consents Recorded</p>
            {/* Progress bar */}
            <div className="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden mt-3">
              <div className="bg-[#006e4b] h-full" style={{ width: '94.2%' }}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#565d79] mt-2">
              <span>62 Pending Signature</span>
              <span>20 FERPA Opt-Outs</span>
            </div>
          </div>
        </div>

        {/* Vector Quality (ArcFace 128-d) */}
        <div className="bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#565d79] uppercase tracking-wider">
              Vector Quality (ArcFace 128-d)
            </span>
            <Fingerprint className="w-4 h-4 text-[#3525cd]" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-[#3525cd]">94%</span>
              <span className="text-[12px] text-[#3525cd] font-bold">High Fidelity Dial</span>
            </div>
            <p className="text-[11px] text-[#565d79] mt-1">0.912 Mean Vector Cosine Density</p>
            {/* Progress bar */}
            <div className="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden mt-3">
              <div className="bg-[#3525cd] h-full" style={{ width: '94%' }}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#565d79] mt-2">
              <span>0 Corrupted Embeddings</span>
              <span className="text-[#006e4b] font-bold">100% Normalized</span>
            </div>
          </div>
        </div>

        {/* Edge Device Sync */}
        <div className="bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#565d79] uppercase tracking-wider">
              Edge Device Sync
            </span>
            <HardDrive className="w-4 h-4 text-[#4f46e5]" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-[#006e4b]">12/12</span>
              <span className="text-[12px] text-[#006e4b] font-bold">Nodes Synced</span>
            </div>
            <p className="text-[11px] text-[#565d79] mt-1">Last Full Push: 04:00 AM Today</p>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#eff4ff]">
              <span className="text-[11px] text-[#565d79]">In Sync: 1,338 Templates</span>
              <button
                onClick={() => onShowToast('Flushing vector caches across all 12 edge inference units...')}
                className="text-[11px] text-[#4f46e5] hover:underline font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Flush Cache
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e5eeff]">
            <div className="flex items-center justify-between border-b border-[#e5eeff] pb-3 mb-4">
              <h3 className="text-[18px] font-bold text-[#0b1c30]">Register New Student</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-[#565d79] hover:text-[#0b1c30] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#565d79] uppercase mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudent.id || ''}
                    onChange={(e) => setNewStudent({ ...newStudent, id: e.target.value })}
                    placeholder="e.g. 590012999"
                    className="w-full h-9 px-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-transparent focus:border-[#4f46e5] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#565d79] uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudent.name || ''}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full h-9 px-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-transparent focus:border-[#4f46e5] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#565d79] uppercase mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  value={newStudent.email || ''}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="s.jenkins@academic.edu"
                  className="w-full h-9 px-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-transparent focus:border-[#4f46e5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#565d79] uppercase mb-1">
                    Programme
                  </label>
                  <select
                    value={newStudent.programme}
                    onChange={(e) => setNewStudent({ ...newStudent, programme: e.target.value })}
                    className="w-full h-9 px-2 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[12px] border border-transparent focus:border-[#4f46e5]"
                  >
                    <option value="B.Tech CSE">B.Tech CSE</option>
                    <option value="B.Tech AI">B.Tech AI</option>
                    <option value="B.Tech ECE">B.Tech ECE</option>
                    <option value="M.Tech Data Science">M.Tech Data Science</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#565d79] uppercase mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={newStudent.semester || 1}
                    onChange={(e) => setNewStudent({ ...newStudent, semester: parseInt(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-transparent focus:border-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#565d79] uppercase mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={newStudent.section || '1'}
                    onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-transparent focus:border-[#4f46e5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#565d79] uppercase mb-1">
                  Consent Status
                </label>
                <select
                  value={newStudent.consent}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      consent: e.target.value as 'RECORDED' | 'NOT_RECORDED' | 'WITHDRAWN'
                    })
                  }
                  className="w-full h-9 px-2 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[12px] border border-transparent focus:border-[#4f46e5]"
                >
                  <option value="RECORDED">RECORDED (FERPA Opt-In Verified)</option>
                  <option value="NOT_RECORDED">NOT_RECORDED (Pending Signature)</option>
                  <option value="WITHDRAWN">WITHDRAWN (Opt-Out)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e5eeff] mt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#565d79] text-[12px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#3525cd] text-white text-[12px] font-bold shadow-sm"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editModalStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e5eeff]">
            <div className="flex items-center justify-between border-b border-[#e5eeff] pb-3 mb-4">
              <h3 className="text-[18px] font-bold text-[#0b1c30]">Edit Student Record</h3>
              <button
                onClick={() => setEditModalStudent(null)}
                className="text-[#565d79] hover:text-[#0b1c30] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditStudentSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#565d79] uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editModalStudent.name}
                  onChange={(e) => setEditModalStudent({ ...editModalStudent, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-transparent focus:border-[#4f46e5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#565d79] uppercase mb-1">
                    Programme
                  </label>
                  <input
                    type="text"
                    value={editModalStudent.programme}
                    onChange={(e) =>
                      setEditModalStudent({ ...editModalStudent, programme: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-transparent focus:border-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#565d79] uppercase mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    value={editModalStudent.semester}
                    onChange={(e) =>
                      setEditModalStudent({ ...editModalStudent, semester: parseInt(e.target.value) })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-transparent focus:border-[#4f46e5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#565d79] uppercase mb-1">
                  Consent Status
                </label>
                <select
                  value={editModalStudent.consent}
                  onChange={(e) =>
                    setEditModalStudent({
                      ...editModalStudent,
                      consent: e.target.value as 'RECORDED' | 'NOT_RECORDED' | 'WITHDRAWN'
                    })
                  }
                  className="w-full h-9 px-2 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[12px] border border-transparent focus:border-[#4f46e5]"
                >
                  <option value="RECORDED">RECORDED</option>
                  <option value="NOT_RECORDED">NOT_RECORDED</option>
                  <option value="WITHDRAWN">WITHDRAWN</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e5eeff] mt-2">
                <button
                  type="button"
                  onClick={() => setEditModalStudent(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#565d79] text-[12px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#3525cd] text-white text-[12px] font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Student Confirmation Modal */}
      {deactivateStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e5eeff] flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#0b1c30]">Deactivate Biometric Profile</h3>
                <span className="text-[12px] text-[#565d79]">ID: #{deactivateStudent.id}</span>
              </div>
            </div>

            <p className="text-[13px] text-[#565d79] leading-relaxed">
              Are you sure you want to deactivate <span className="font-bold text-[#0b1c30]">{deactivateStudent.name}</span>?
              This will permanently purge their 128-dimensional ArcFace vector embedding from all 12 edge inference cameras.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeactivateStudent(null)}
                className="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#565d79] text-[12px] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeactivate}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold shadow-sm"
              >
                Purge & Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consent Portal Modal */}
      {consentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e5eeff] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#e5eeff] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#006e4b]" />
                <h3 className="text-[16px] font-bold text-[#0b1c30]">Institutional FERPA Consent Portal</h3>
              </div>
              <button onClick={() => setConsentModalOpen(false)} className="text-[#565d79]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[13px] text-[#565d79] leading-relaxed">
              In accordance with academic privacy regulations, all biometric enrollments require digital student consent.
              Students who opt out will have attendance verified through traditional ID card swipe or instructor roll-call.
            </p>

            <div className="bg-[#eff4ff] p-3 rounded-xl border border-[#dce9ff] text-[12px] flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="font-medium text-[#0b1c30]">Active Opt-In Consent Form</span>
                <span className="text-[#006e4b] font-bold">Version 2025.2</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[#0b1c30]">Automated Vector Purge Period</span>
                <span className="text-[#565d79]">End of Semester</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[#0b1c30]">Total Pending Invitations</span>
                <span className="text-amber-800 font-bold">62 Students</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setConsentModalOpen(false);
                  onShowToast('Dispatched automated FERPA consent reminders to 62 students.');
                }}
                className="px-4 py-2 rounded-lg bg-[#4f46e5] text-white text-[12px] font-bold shadow-sm"
              >
                Send Consent Reminders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
