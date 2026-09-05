import React, { useState, useEffect } from 'react';
import { runAllAutomatedTests } from '../engine/testSuite';
import { TestResultItem } from '../types';
import { PlayCircle, CheckCircle, XCircle, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

export const TestRunnerView: React.FC = () => {
  const [tests, setTests] = useState<TestResultItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = runAllAutomatedTests();
      setTests(results);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    runTests();
  }, []);

  const totalPassed = tests.filter(t => t.passed).length;
  const allPassed = tests.length > 0 && totalPassed === tests.length;

  return (
    <div id="automated-tests-page" className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border border-[#121212] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#121212] pb-6">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] italic text-[#121212]/70 block mb-1">
              Deterministic Verification
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold italic serif text-[#121212]">
              Automated Engine Test Suite
            </h2>
            <p className="text-xs text-[#121212]/70 mt-1 font-medium max-w-xl">
              Deterministic test harness verifying normal, edge-case, and adversarial priority conditions.
            </p>
          </div>

          <button
            id="btn-run-tests"
            onClick={runTests}
            disabled={isRunning}
            className="px-6 py-2.5 border-2 border-[#121212] bg-[#FF4E00] hover:bg-[#121212] text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer"
          >
            <PlayCircle className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Executing Suite...' : 'Re-Run Verification Suite'}
          </button>
        </div>

        {/* Test Summary Banner */}
        <div className="mt-6 p-4 bg-[#F9F9F7] border border-[#121212] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            {allPassed ? (
              <CheckCircle className="w-5 h-5 text-[#121212] shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-[#FF4E00] shrink-0" />
            )}
            <div>
              <span className="font-bold text-[#121212] uppercase tracking-wider text-xs">
                {totalPassed} of {tests.length} Verification Invariants Satisfied
              </span>
              <span className="text-[#121212]/70 ml-2 font-mono">
                ({((totalPassed / (tests.length || 1)) * 100).toFixed(0)}% Pass Rate)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#121212]/70">
            <Clock className="w-4 h-4 text-[#FF4E00]" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Total Execution Latency:</span>
            <strong className="font-mono text-[#121212] font-black">
              {tests.reduce((acc, t) => acc + t.duration_ms, 0).toFixed(2)} ms
            </strong>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="space-y-4">
        {tests.map((test) => {
          return (
            <div
              key={test.id}
              className={`bg-white border border-[#121212] p-5 space-y-3 ${
                test.passed ? '' : 'border-2 border-[#FF4E00]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#121212]/10 pb-2">
                <div className="flex items-center gap-2.5">
                  {test.passed ? (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider bg-[#121212] text-[#F9F9F7]">
                      PASSED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider bg-[#FF4E00] text-white">
                      FAILED
                    </span>
                  )}
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-[#121212]/30 uppercase text-[#121212]/70">
                    {test.category}
                  </span>
                  <h3 className="text-xs font-bold text-[#121212] uppercase tracking-wider font-mono">
                    {test.test_name}
                  </h3>
                </div>

                <span className="text-xs font-mono text-[#121212]/50">
                  {test.duration_ms} ms
                </span>
              </div>

              <p className="text-xs text-[#121212]/80 leading-relaxed font-sans">
                {test.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono bg-[#F9F9F7] p-3 border border-[#121212]/20">
                <div>
                  <span className="text-[#121212]/50 block font-sans text-[10px] font-bold uppercase tracking-widest mb-0.5">
                    Expected Invariant:
                  </span>
                  <span className="text-[#121212] break-words text-[11px]">{test.expected}</span>
                </div>
                <div>
                  <span className="text-[#121212]/50 block font-sans text-[10px] font-bold uppercase tracking-widest mb-0.5">
                    Evaluated Runtime Result:
                  </span>
                  <span className={`break-words text-[11px] font-bold ${test.passed ? 'text-[#121212]' : 'text-[#FF4E00]'}`}>
                    {test.actual}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
