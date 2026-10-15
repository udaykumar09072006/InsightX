import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Database, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Info,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { CopilotQueryResponse } from '../../types/copilot';
import { sendCopilotQuery } from '../../services/copilotClient';
import { AnalyticsChart } from './AnalyticsChart';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  response?: CopilotQueryResponse;
  timestamp: string;
  feedback?: 'helpful' | 'unhelpful';
}

const SUGGESTED_QUESTIONS = [
  "What was our monthly revenue trend?",
  "Which countries generated the highest revenue?",
  "Which products contributed the most to revenue?",
  "How has average order value changed over time?",
  "Which identified customers have not purchased recently?",
  "Compare monthly revenue for the top five countries",
  "What percentage of revenue comes from the top 10 products?",
  "Which customer cohorts show the weakest repeat-purchase behavior?",
  "Explain the largest observed month-over-month revenue change",
  "What is our customer acquisition cost (CAC)?" // demonstrates unsupported question handling
];

export const CopilotView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSqlId, setCopiedSqlId] = useState<string | null>(null);
  const [collapsedSql, setCollapsedSql] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || loading) return;

    const userMsgId = 'msg_' + Date.now();
    const newMessages: Message[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setInputQuestion('');
    setLoading(true);

    try {
      // Execute via the copilot client service (calls /api/v1/copilot/query with fallback)
      const res = await sendCopilotQuery({ question: q });

      const assistantMsgId = 'asst_' + Date.now();
      setMessages([
        ...newMessages,
        {
          id: assistantMsgId,
          sender: 'assistant',
          response: res,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: 'asst_err_' + Date.now(),
          sender: 'assistant',
          text: `An error occurred executing your request: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputQuestion);
    }
  };

  const copySql = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSqlId(id);
    setTimeout(() => setCopiedSqlId(null), 2000);
  };

  const toggleSql = (id: string) => {
    setCollapsedSql(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setFeedback = (msgId: string, feedback: 'helpful' | 'unhelpful') => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback } : m));
    // Post to feedback API in background
    fetch('/api/v1/copilot/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: msgId, helpful: feedback === 'helpful' })
    }).catch(() => {});
  };

  const downloadCsv = (response: CopilotQueryResponse) => {
    const columns = response.columns;
    const rows = response.rows;
    if (!columns || !rows || rows.length === 0) return;

    // Formula injection sanitization
    const sanitize = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = columns.map(sanitize).join(',');
    const dataRows = rows.map(r => columns.map(col => sanitize(r[col])).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([header, ...dataRows].join('\n'));

    const anchor = document.createElement('a');
    anchor.setAttribute('href', csvContent);
    anchor.setAttribute('download', `insightx_${response.request_id}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[640px] max-w-6xl mx-auto space-y-4">
      {/* Top Banner Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="font-bold text-white tracking-wide">InsightX AI Analytics Copilot</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono">SQLite / PostgreSQL Engine</span>
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> AST Read-Only Sandbox
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-1 font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Dec 2010 – Dec 2011
          </span>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 transition ml-2"
              title="Reset Conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2 no-scrollbar">
        {/* Welcome Empty State */}
        {messages.length === 0 && (
          <div className="py-8 px-4 text-center space-y-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 mx-auto shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
            </div>

            <div className="max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-white tracking-tight">How can I assist your analysis today?</h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Ask analytical questions in natural language. The Copilot translates intent into verified SQL, executes it against 536,641 transactions, and returns data tables, charts, and mathematical definitions.
              </p>
            </div>

            {/* Suggested Question Chips */}
            <div className="max-w-3xl mx-auto pt-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Suggested Analytical Queries
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {SUGGESTED_QUESTIONS.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sq)}
                    className="p-3 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-white transition flex items-center justify-between group shadow-sm"
                  >
                    <span className="truncate mr-2">{sq}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conversation List */}
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3">
            {/* User Bubble */}
            {msg.sender === 'user' && (
              <div className="flex justify-end">
                <div className="max-w-xl bg-indigo-600/90 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs font-medium shadow-md">
                  {msg.text}
                </div>
              </div>
            )}

            {/* Assistant Response Container */}
            {msg.sender === 'assistant' && (
              <div className="flex flex-col space-y-3 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-lg">
                {/* Header: Status and Execution Time */}
                {msg.response && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase tracking-wider ${
                        msg.response.status === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : msg.response.status === 'unsupported' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {msg.response.status}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ID: {msg.response.request_id}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
                      <span>Rows: <strong className="text-slate-200">{msg.response.row_count}</strong></span>
                      <span>•</span>
                      <span>Execution: <strong className="text-emerald-400">{msg.response.execution_ms}ms</strong></span>
                    </div>
                  </div>
                )}

                {/* Evidence-Based Summary */}
                <div className="text-xs text-slate-200 leading-relaxed font-sans">
                  {msg.response?.summary || msg.text}
                </div>

                {/* Dynamic Chart if returned */}
                {msg.response && msg.response.chart && msg.response.rows.length > 0 && (
                  <AnalyticsChart 
                    chart={msg.response.chart} 
                    columns={msg.response.columns} 
                    rows={msg.response.rows} 
                  />
                )}

                {/* Results Table */}
                {msg.response && msg.response.rows && msg.response.rows.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Queried Transaction Records</span>
                      <button
                        onClick={() => downloadCsv(msg.response!)}
                        className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-xs font-medium"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-56">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-slate-400 text-[11px]">
                          <tr>
                            {msg.response.columns.map((c, i) => (
                              <th key={i} className="py-2 px-3 font-semibold whitespace-nowrap">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                          {msg.response.rows.slice(0, 10).map((r, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-800/30">
                              {msg.response!.columns.map((col, cIdx) => (
                                <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap">
                                  {typeof r[col] === 'number' && col.includes('revenue') 
                                    ? `£${r[col].toLocaleString('en-GB')}` 
                                    : String(r[col] ?? '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Collapsible SQL Inspector */}
                {msg.response && msg.response.sql && (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70 text-xs mt-2">
                    <div 
                      onClick={() => toggleSql(msg.id)}
                      className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition"
                    >
                      <div className="flex items-center space-x-2 text-slate-300 font-semibold font-mono">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Executed SQL Statement</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400">
                          AST Validated
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copySql(msg.response!.sql, msg.id);
                          }}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                        >
                          {copiedSqlId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        {collapsedSql[msg.id] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {!collapsedSql[msg.id] && (
                      <pre className="p-3.5 border-t border-slate-800 bg-[#070a12] text-cyan-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                        <code>{msg.response.sql}</code>
                      </pre>
                    )}
                  </div>
                )}

                {/* Metric Definitions & Warnings */}
                {msg.response && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
                    {msg.response.metric_definitions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
                        <span className="font-semibold text-slate-300">Approved Metrics:</span>
                        {msg.response.metric_definitions.map(m => (
                          <span 
                            key={m.id} 
                            className="px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300 font-mono border border-slate-700/50"
                            title={m.description}
                          >
                            {m.name} ({m.unit})
                          </span>
                        ))}
                      </div>
                    )}

                    {msg.response.warnings.length > 0 && (
                      <div className="flex items-start space-x-2 text-amber-400/90 bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{msg.response.warnings.join(' • ')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 text-xs text-slate-500">
                  <span>Ground truth derived from UCI Online Retail database</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px]">Was this helpful?</span>
                    <button
                      onClick={() => setFeedback(msg.id, 'helpful')}
                      className={`p-1 rounded hover:bg-slate-800 transition ${
                        msg.feedback === 'helpful' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setFeedback(msg.id, 'unhelpful')}
                      className={`p-1 rounded hover:bg-slate-800 transition ${
                        msg.feedback === 'unhelpful' ? 'text-rose-400 bg-slate-800' : 'text-slate-400'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center space-x-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl w-max">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-300 font-medium">
              Formulating query plan & validating read-only SQL execution...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Textarea Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
        <div className="flex items-end space-x-2.5">
          <textarea
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about revenue, orders, AOV, top countries, cohorts, or products (e.g. 'Show monthly revenue trend')..."
            rows={1}
            className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none resize-none min-h-[38px] max-h-32 py-2.5 px-2 font-sans"
          />

          <button
            onClick={() => handleSend(inputQuestion)}
            disabled={!inputQuestion.trim() || loading}
            className={`p-2.5 rounded-lg transition font-medium flex items-center justify-center shrink-0 ${
              inputQuestion.trim() && !loading
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
          <span>Press <strong>Enter</strong> to ask • <strong>Shift+Enter</strong> for newline</span>
          <span className="text-cyan-400 font-mono">100% Deterministic & Verified Grounding</span>
        </div>
      </div>
    </div>
  );
};
