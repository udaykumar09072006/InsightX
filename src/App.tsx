/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Header } from './components/Header';
import { ExecutiveOverview } from './components/ExecutiveOverview';
import { ProductAnalytics } from './components/ProductAnalytics';
import { CustomerRFM } from './components/CustomerRFM';
import { CohortRetention } from './components/CohortRetention';
import { StatisticalTesting } from './components/StatisticalTesting';
import { SqlExplorer } from './components/SqlExplorer';
import { PowerBiDax } from './components/PowerBiDax';
import { DataQualityAudit } from './components/DataQualityAudit';
import { CopilotView } from './components/copilot/CopilotView';
import { BarChart3, Database, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('copilot');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Global Executive Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'copilot' && (
          <CopilotView />
        )}
        {activeTab === 'executive' && (
          <ExecutiveOverview selectedCountry={selectedCountry} />
        )}
        {activeTab === 'products' && (
          <ProductAnalytics />
        )}
        {activeTab === 'rfm' && (
          <CustomerRFM />
        )}
        {activeTab === 'cohorts' && (
          <CohortRetention />
        )}
        {activeTab === 'statistical' && (
          <StatisticalTesting />
        )}
        {activeTab === 'sql' && (
          <SqlExplorer />
        )}
        {activeTab === 'powerbi' && (
          <PowerBiDax />
        )}
        {activeTab === 'quality' && (
          <DataQualityAudit />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">InsightX Platform</span>
            <span>•</span>
            <span>Audited Production Portfolio Project</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono">UCI Online Retail (DOI: 10.24432/C5BW33)</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Real Computed Data (Zero Fabricated Metrics)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
