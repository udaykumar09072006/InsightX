import React from 'react';
import { 
  BarChart3, 
  Calendar, 
  Globe2, 
  Database, 
  Download, 
  CheckCircle2, 
  Layers, 
  Clock, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { ANALYTICS_DATA } from '../data/analyticsData';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCountry: string;
  setSelectedCountry: (c: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedCountry,
  setSelectedCountry,
}) => {
  const exportData = () => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ANALYTICS_DATA, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonStr);
    downloadAnchor.setAttribute("download", "insightx_analytics_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const navItems = [
    { id: 'copilot', label: 'AI Copilot', icon: Sparkles },
    { id: 'executive', label: 'Executive Overview', icon: BarChart3 },
    { id: 'products', label: 'Sales & Products', icon: Layers },
    { id: 'rfm', label: 'Customer RFM', icon: Database },
    { id: 'cohorts', label: 'Cohort Retention', icon: Calendar },
    { id: 'statistical', label: 'Statistical Tests', icon: Globe2 },
    { id: 'sql', label: 'SQL Analytics (20+)', icon: Database },
    { id: 'powerbi', label: 'Power BI & DAX', icon: ExternalLink },
    { id: 'quality', label: 'Data Quality & Audit', icon: CheckCircle2 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-extrabold text-xl tracking-tight text-white">Insight<span className="text-cyan-400">X</span></span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified Data
              </span>
            </div>
            <p className="text-xs text-slate-400">Business Intelligence & Customer Analytics Platform • UCI Online Retail</p>
          </div>
        </div>

        {/* Global Controls & Meta */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Country Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Globe2 className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Markets (38 Countries)</option>
              <option value="United Kingdom" className="bg-slate-900 text-slate-200">United Kingdom (82.1%)</option>
              <option value="Netherlands" className="bg-slate-900 text-slate-200">Netherlands</option>
              <option value="EIRE" className="bg-slate-900 text-slate-200">EIRE (Ireland)</option>
              <option value="Germany" className="bg-slate-900 text-slate-200">Germany</option>
              <option value="France" className="bg-slate-900 text-slate-200">France</option>
              <option value="Australia" className="bg-slate-900 text-slate-200">Australia</option>
              <option value="Switzerland" className="bg-slate-900 text-slate-200">Switzerland</option>
              <option value="Spain" className="bg-slate-900 text-slate-200">Spain</option>
            </select>
          </div>

          {/* Last Refresh Timestamp */}
          <div className="hidden sm:flex items-center text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 rounded-lg px-2.5 py-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
            <span>Snapshot: <strong className="text-slate-300 font-mono">2011-12-10</strong></span>
          </div>

          {/* Export Button */}
          <button
            onClick={exportData}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Pipeline JSON</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar border-t border-slate-900">
        <nav className="flex space-x-1 py-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
