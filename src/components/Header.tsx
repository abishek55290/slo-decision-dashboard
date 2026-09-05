import React from 'react';
import { ShieldCheck, UserCheck, AlertTriangle, RefreshCw, Zap, BookOpen, Layers } from 'lucide-react';
import { User, UserRole } from '../types';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  examMode: boolean;
  onExamModeToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onResetData: () => void;
  isResetting: boolean;
  onOpenDocs: () => void;
}

export const USERS: User[] = [
  {
    id: 'usr_mgr_1',
    name: 'Elena Rostova',
    email: 'elena.rostova@examlearn.edu',
    role: 'ENGINEERING_MANAGER',
    title: 'Director of SRE & Infrastructure'
  },
  {
    id: 'usr_eng_1',
    name: 'Marcus Chen',
    email: 'marcus.chen@examlearn.edu',
    role: 'ENGINEER',
    title: 'Senior Reliability Engineer'
  }
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  examMode,
  onExamModeToggle,
  activeTab,
  onTabChange,
  onResetData,
  isResetting,
  onOpenDocs
}) => {
  return (
    <header id="app-header" className="bg-[#F9F9F7] text-[#121212] border-b-2 border-[#121212] sticky top-0 z-30">
      {/* Top Editorial Ribbon */}
      <div className="bg-[#121212] text-[#F9F9F7] text-[10px] tracking-[0.25em] font-bold py-2 px-4 sm:px-8 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF4E00] animate-pulse shrink-0" />
          <span>DEMO ENVIRONMENT — SYNTHETIC LEARNING PLATFORM DATA</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] tracking-widest uppercase">
          <span className="hidden sm:inline-flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${examMode ? 'bg-[#FF4E00]' : 'bg-emerald-400'}`} />
            {examMode ? 'EXAMINATION PERIOD ACTIVE' : 'SEMESTER OFF-PEAK'}
          </span>
          <span className="opacity-40">|</span>
          <button
            id="btn-docs-guide"
            onClick={onOpenDocs}
            className="hover:text-[#FF4E00] underline font-bold tracking-wider transition-colors flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3" />
            18-Step Guide & Arch
          </button>
          <span className="opacity-40">|</span>
          <button
            id="btn-reset-data"
            onClick={onResetData}
            disabled={isResetting}
            className="hover:text-[#FF4E00] flex items-center gap-1 transition-opacity hover:opacity-90"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isResetting ? 'animate-spin' : ''}`} />
            Reset Data
          </button>
        </div>
      </div>

      {/* Main Editorial Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-4 flex flex-wrap justify-between items-end gap-4 border-b border-[#121212]">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-4xl sm:text-6xl font-black leading-none tracking-tighter uppercase italic serif">
              SLO Decision
            </h1>
            <span className="text-[10px] font-mono font-bold tracking-widest px-1.5 py-0.5 border border-[#121212] uppercase bg-white">
              v1.0-prod
            </span>
          </div>
          <p className="text-xs sm:text-sm tracking-widest uppercase font-bold mt-2 text-[#121212]/80">
            Reliability Prioritization Engine for Examination Platforms
          </p>
        </div>

        {/* Right Controls: Manager Persona & Controls */}
        <div className="flex flex-col sm:items-end gap-3">
          <div className="text-left sm:text-right">
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-0.5 italic">
              Authorized Personnel Only
            </p>
            <p className="text-base sm:text-lg font-bold italic serif">
              {currentUser.role === 'ENGINEERING_MANAGER' ? 'Manager: ' : 'Engineer: '}
              <span className="underline decoration-[#FF4E00] decoration-2">{currentUser.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Exam Mode Toggle */}
            <button
              id="toggle-exam-mode"
              onClick={onExamModeToggle}
              className={`flex items-center gap-2 px-3 py-1.5 border-2 text-xs font-black uppercase tracking-wider transition-all ${
                examMode
                  ? 'bg-[#FF4E00] border-[#FF4E00] text-white hover:bg-transparent hover:text-[#FF4E00]'
                  : 'bg-white border-[#121212] text-[#121212] hover:bg-[#121212] hover:text-[#F9F9F7]'
              }`}
              title="Toggle active examination period weighting in the decision engine"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Exam Mode: {examMode ? 'ACTIVE' : 'OFF-PEAK'}</span>
            </button>

            {/* Role Switcher */}
            <div className="flex items-center border-2 border-[#121212] bg-white p-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 text-[#121212]/60 hidden md:inline">
                Role:
              </span>
              {USERS.map(u => {
                const isSelected = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    id={`btn-user-${u.role.toLowerCase()}`}
                    onClick={() => onUserChange(u)}
                    className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-all ${
                      isSelected
                        ? 'bg-[#121212] text-[#F9F9F7]'
                        : 'text-[#121212] hover:bg-slate-200'
                    }`}
                  >
                    {u.name.split(' ')[0]} ({u.role === 'ENGINEERING_MANAGER' ? 'Mgr' : 'Eng'})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Editorial Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex overflow-x-auto gap-0 bg-[#F9F9F7]">
        {[
          { id: 'dashboard', label: 'Main Dashboard' },
          { id: 'rules', label: 'Configurable Rules' },
          { id: 'decisions', label: 'Decisions & History' },
          { id: 'evaluation', label: 'Evaluation Metrics (Success %)' },
          { id: 'error-analysis', label: 'Error Analysis' },
          { id: 'tests', label: 'Automated Test Suite' }
        ].map(tab => (
          <button
            key={tab.id}
            id={`tab-nav-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2.5 text-xs uppercase tracking-widest font-black whitespace-nowrap border-b-2 transition-all border-r border-[#121212]/10 ${
              activeTab === tab.id
                ? 'border-b-2 border-[#121212] text-[#121212] bg-white shadow-xs'
                : 'border-transparent text-[#121212]/60 hover:text-[#121212] hover:bg-slate-200/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
