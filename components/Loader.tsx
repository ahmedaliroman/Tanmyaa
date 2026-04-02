import React, { useState, useEffect } from 'react';

const VALIDATION_STEPS = [
  "MAPPING JURISDICTION & CLIMATE ZONE...",
  "ACCESSING TIER 1: STATUTORY AUTHORITY (LOCAL/MUNICIPAL)...",
  "EXTRACTING METRICS (FAR, SETBACKS, HEIGHT)...",
  "VALIDATING AGAINST TIER 2: EXECUTIVE FRAMEWORK (NATIONAL)...",
  "SYNTHESIZING TIER 3: ACADEMIC & SCHOLARLY EVIDENCE...",
  "AUDITING GLOBAL STANDARDS (ISO 37101/37120)...",
  "EXECUTING SCHOLAR VS. STATUTE MEDIATION...",
  "FINALIZING PRECISION VALIDATION REPORT..."
];

const Loader: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % VALIDATION_STEPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center py-10" aria-label="Loading content">
      <div className="ios-loader mx-auto">
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
      </div>
      <div className="mt-8 space-y-2">
        <p className="text-xs font-bold text-blue-400 tracking-[0.2em] uppercase opacity-80">
          Precision Validation Protocol Active
        </p>
        <p className="text-lg font-medium text-white tracking-wide animate-pulse h-8">
          {VALIDATION_STEPS[stepIndex]}
        </p>
        <p className="text-gray-500 text-xs italic max-w-xs mx-auto">
          Synthesizing authoritative tiered sources for zero-hallucination accuracy.
        </p>
      </div>
    </div>
  );
};

export default Loader;
