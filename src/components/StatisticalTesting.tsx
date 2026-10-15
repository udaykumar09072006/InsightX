import React, { useState } from 'react';
import { Globe2, TrendingUp, CheckCircle, HelpCircle, FileText, BarChart2, ShieldCheck } from 'lucide-react';
import { ANALYTICS_DATA } from '../data/analyticsData';

export const StatisticalTesting: React.FC = () => {
  const { kpi } = ANALYTICS_DATA;
  const t_test = kpi.statistical_tests.uk_vs_international_aov.results;
  const pareto = kpi.pareto_summary;

  const [activeTest, setActiveTest] = useState<'welch' | 'gini' | 'repeat'>('welch');

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1">
              <Globe2 className="w-3.5 h-3.5" />
              <span>Inferential Statistics & Hypothesis Testing</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Statistical Rigor & Significance Testing</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Empirical evaluation of observational transaction variances using parametric testing and inequality metrics.
            </p>
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTest('welch')}
              className={`px-3 py-1.5 rounded font-medium transition ${
                activeTest === 'welch' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Welch's t-Test (AOV)
            </button>
            <button
              onClick={() => setActiveTest('gini')}
              className={`px-3 py-1.5 rounded font-medium transition ${
                activeTest === 'gini' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gini Inequality
            </button>
          </div>
        </div>
      </div>

      {/* Investigation 1: Welch's t-test */}
      {activeTest === 'welch' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Hypothesis Investigation 1</span>
                <h3 className="text-base font-bold text-white">
                  Welch's Two-Sample t-Test: Domestic (UK) vs International Order Sizing
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Statistically Significant (p &lt; 0.0001)
              </span>
            </div>

            {/* Hypotheses Stated */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 uppercase text-[10px] block">Null Hypothesis (H₀)</span>
                <div className="text-slate-200 font-semibold mt-1">
                  μ(International) = μ(UK)
                </div>
                <p className="text-slate-400 font-sans mt-1 text-[11px]">
                  Average Order Value of International wholesale orders is equal to UK domestic orders.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 uppercase text-[10px] block">Alternative Hypothesis (H₁)</span>
                <div className="text-cyan-300 font-semibold mt-1">
                  μ(International) ≠ μ(UK)
                </div>
                <p className="text-slate-400 font-sans mt-1 text-[11px]">
                  Average Order Value differs significantly between International and UK transactions.
                </p>
              </div>
            </div>

            {/* Test Results Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">UK Domestic AOV (x̄₁)</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">£{t_test.mean1}</div>
                <div className="text-[10px] font-mono text-slate-500">n = {t_test.n1.toLocaleString()} orders</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">International AOV (x̄₂)</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">£{t_test.mean2}</div>
                <div className="text-[10px] font-mono text-slate-500">n = {t_test.n2.toLocaleString()} orders</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Difference in Means</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">+£{Math.abs(t_test.mean_difference)}</div>
                <div className="text-[10px] font-mono text-slate-500">95% CI: [£{Math.abs(t_test.ci_95_lower)}, £{Math.abs(t_test.ci_95_upper)}]</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Welch's t-statistic</div>
                <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">{Math.abs(t_test.t_statistic)}</div>
                <div className="text-[10px] font-mono text-slate-500">df = {t_test.degrees_of_freedom} | Cohen's d = {Math.abs(t_test.cohens_d)}</div>
              </div>
            </div>

            {/* Methodological Context & Caveats */}
            <div className="mt-5 p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Analytical Interpretation & Assumptions
              </h4>
              <p>
                <strong>Statistical Decision:</strong> Because p &lt; 0.0001 (well below α = 0.05), we reject the null hypothesis H₀. 
                International buyers order with an average basket premium of <strong>+£401.87 per transaction</strong>.
              </p>
              <p>
                <strong>Business Causality Caveat:</strong> This observational difference is driven by logistics economics: non-UK wholesale distributors consolidate freight into container/pallet shipments to minimize fixed cross-border shipping and customs costs. 
                We do not claim international customers have higher inherent consumer utility, but rather distinct logistics ordering behavior.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Investigation 2: Gini Inequality */}
      {activeTest === 'gini' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Statistical Investigation 2</span>
              <h3 className="text-base font-bold text-white">
                Revenue Inequality & Customer Concentration (Gini Index)
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
              High Inequality ($G = {pareto.gini_coefficient}$)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Gini Coefficient ($G$)</div>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {pareto.gini_coefficient}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Scale 0 (perfect equality) to 1 (pure monopoly). Score of {pareto.gini_coefficient} confirms extreme power-law distribution.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Top 10% Customer Share</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {pareto.top_10_pct_customers_share}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                The top 437 accounts generate almost two-thirds of all identified business revenue.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Top 20% Product Share</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {pareto.top_20_pct_products_share}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Classic 80/20 Pareto distribution confirmed empirically on 4,070 product SKUs.
              </p>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <h4 className="font-bold text-white mb-1">Strategic Portfolio Implication:</h4>
            <p>
              In wholesale commerce, a high Gini coefficient is customary. However, relying on the top 10% of customers for 63% of net revenue exposes the enterprise to high account concentration risk. 
              Implementing enterprise SLAs, multi-year supply contracts, and proactive account health monitoring is mandatory to safeguard working capital.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
