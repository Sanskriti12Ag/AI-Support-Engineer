import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  History,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const sampleError = `2026-10-02 18:42:10 ERROR API request failed
2026-10-02 18:42:10 ERROR Connection refused while connecting to localhost:5000
2026-10-02 18:42:11 WARNING Retrying connection
2026-10-02 18:42:13 ERROR Maximum retry attempts exceeded
HTTP 500`;

function App() {
  const [errorText, setErrorText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);

  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [error, setError] = useState("");

  const [question, setQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [fileName, setFileName] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setHistoryLoading(true);

      const response = await fetch(`${API_URL}/api/history/`);

      if (!response.ok) {
        throw new Error("Could not load history");
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function analyzeError() {
    if (!errorText.trim()) {
      setError("Please paste an error or log before analyzing.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnalysis(null);
      setSelectedHistory(null);

      const response = await fetch(`${API_URL}/api/analysis/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error_text: errorText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Analysis failed");
      }

      setAnalysis(data);

      await loadHistory();

      // Get latest history entry.
      const historyResponse = await fetch(`${API_URL}/api/history/`);

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();

        if (historyData.length > 0) {
          setAnalysisId(historyData[0].id);
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadLog(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setError("");

    if (!file.name.toLowerCase().endsWith(".log")) {
      setError("Only .log files are supported.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setAnalysis(null);
      setSelectedHistory(null);

      const response = await fetch(`${API_URL}/api/analysis/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "File analysis failed");
      }

      setAnalysis(data);

      await loadHistory();

      const historyResponse = await fetch(`${API_URL}/api/history/`);

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();

        if (historyData.length > 0) {
          setAnalysisId(historyData[0].id);
        }
      }
    } catch (err) {
      setError(err.message || "Could not analyze the file.");
    } finally {
      setLoading(false);
    }
  }

  async function openHistory(id) {
    try {
      setError("");
      setSelectedHistory(id);

      const response = await fetch(`${API_URL}/api/history/${id}`);

      if (!response.ok) {
        throw new Error("Could not load analysis.");
      }

      const data = await response.json();

      setAnalysis(data);
      setAnalysisId(id);
      setChatAnswer("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function askAI() {
    if (!question.trim() || !analysisId) return;

    try {
      setChatLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis_id: analysisId,
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "AI response failed");
      }

      setChatAnswer(data.answer);
      setQuestion("");
    } catch (err) {
      setError(err.message || "Could not contact AI.");
    } finally {
      setChatLoading(false);
    }
  }

  function useSample() {
    setErrorText(sampleError);
    setError("");
  }

  function clearAll() {
    setErrorText("");
    setAnalysis(null);
    setAnalysisId(null);
    setSelectedHistory(null);
    setChatAnswer("");
    setQuestion("");
    setFileName("");
    setError("");
  }

  const severityClass = {
    Low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    Medium: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    High: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    Critical: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080b12]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Bot size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-white">
                AI Support Engineer
              </h1>

              <p className="text-xs text-gray-500">
                Developer troubleshooting intelligence
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              API Online
            </div>

            <div className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-400">
              v1.0
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-[1500px] px-6 py-8">
        {/* HERO */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm text-blue-400">
            <Sparkles size={16} />
            AI-powered incident analysis
          </div>

          <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-white md:text-5xl">
            Turn confusing errors into{" "}
            <span className="text-blue-400">actionable fixes.</span>
          </h2>

          <p className="mt-4 max-w-2xl text-gray-400">
            Paste an error or upload a log file. The AI analyzes the evidence,
            identifies the likely root cause, and gives you practical next
            steps.
          </p>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* INPUT + HISTORY */}
        <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">
                  Analyze an incident
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Paste an exception, stack trace, or application log.
                </p>
              </div>

              <button
                onClick={useSample}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                Use sample
              </button>
            </div>

            <textarea
              value={errorText}
              onChange={(e) => setErrorText(e.target.value)}
              placeholder={`Paste something like:

Connection refused while connecting to localhost:5000
HTTP 500 Internal Server Error
Database connection timeout...`}
              className="min-h-[260px] w-full resize-y rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-sm leading-6 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white">
                  <Upload size={16} />
                  Upload .log

                  <input
                    type="file"
                    accept=".log"
                    className="hidden"
                    onChange={uploadLog}
                  />
                </label>

                {fileName && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FileText size={14} />
                    {fileName}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearAll}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
                >
                  Clear
                </button>

                <button
                  onClick={analyzeError}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={17} />
                      Analyze
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* HISTORY */}
          <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={18} className="text-gray-400" />
                <h3 className="font-semibold text-white">History</h3>
              </div>

              <button
                onClick={loadHistory}
                className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white"
              >
                <RefreshCw
                  size={15}
                  className={historyLoading ? "animate-spin" : ""}
                />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                <Clock3
                  size={22}
                  className="mx-auto mb-2 text-gray-600"
                />
                <p className="text-sm text-gray-500">
                  No analyses yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openHistory(item.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedHistory === item.id
                        ? "border-blue-500/30 bg-blue-500/10"
                        : "border-white/5 bg-black/10 hover:border-white/10 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-200">
                          {item.error_type}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.category}
                        </p>
                      </div>

                      <ChevronRight
                        size={15}
                        className="mt-1 shrink-0 text-gray-600"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                          severityClass[item.severity] ||
                          severityClass.Medium
                        }`}
                      >
                        {item.severity}
                      </span>

                      <span className="text-[10px] text-gray-600">
                        #{item.id}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>

        {/* RESULTS */}
        {analysis && (
          <section className="mt-8 space-y-5">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-blue-400" />
              <h2 className="text-xl font-bold text-white">
                Analysis Result
              </h2>
            </div>

            {/* TOP STATS */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Error Type"
                value={analysis.error_type}
                icon={<AlertCircle size={18} />}
              />

              <StatCard
                label="Category"
                value={analysis.category}
                icon={<ShieldAlert size={18} />}
              />

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-3 text-xs uppercase tracking-wider text-gray-500">
                  Severity
                </p>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${
                    severityClass[analysis.severity] ||
                    severityClass.Medium
                  }`}
                >
                  {analysis.severity}
                </span>
              </div>

              <StatCard
                label="Confidence"
                value={`${Math.round(analysis.confidence * 100)}%`}
                icon={<CheckCircle2 size={18} />}
              />
            </div>

            {/* ROOT CAUSE */}
            <div className="grid gap-5 lg:grid-cols-2">
              <ResultCard title="Likely Root Cause">
                <p className="leading-7 text-gray-300">
                  {analysis.root_cause}
                </p>
              </ResultCard>

              <ResultCard title="Explanation">
                <p className="leading-7 text-gray-300">
                  {analysis.explanation}
                </p>
              </ResultCard>
            </div>

            {/* FIX */}
            <ResultCard title="Suggested Fix">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <p className="whitespace-pre-wrap leading-7 text-gray-300">
                  {analysis.suggested_fix}
                </p>
              </div>
            </ResultCard>

            {/* EVIDENCE + ACTIONS */}
            <div className="grid gap-5 lg:grid-cols-2">
              <ResultCard title="Evidence">
                {analysis.evidence?.length ? (
                  <ul className="space-y-3">
                    {analysis.evidence.map((item, index) => (
                      <li
                        key={index}
                        className="flex gap-3 rounded-xl border border-white/5 bg-black/10 p-3 text-sm text-gray-300"
                      >
                        <span className="mt-0.5 text-blue-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No evidence returned.</p>
                )}
              </ResultCard>

              <ResultCard title="Recommended Actions">
                {analysis.recommended_actions?.length ? (
                  <ol className="space-y-3">
                    {analysis.recommended_actions.map((item, index) => (
                      <li
                        key={index}
                        className="flex gap-3 text-sm text-gray-300"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-semibold text-blue-400">
                          {index + 1}
                        </span>

                        <span className="pt-1">{item}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-500">No actions returned.</p>
                )}
              </ResultCard>
            </div>

            {/* LOG SUMMARY */}
            {analysis.log_summary && (
              <ResultCard title="Log Summary">
                <div className="grid gap-3 sm:grid-cols-4">
                  <SummaryItem
                    label="Total Lines"
                    value={analysis.log_summary.total_lines}
                  />

                  <SummaryItem
                    label="Errors"
                    value={analysis.log_summary.errors?.length || 0}
                  />

                  <SummaryItem
                    label="Warnings"
                    value={analysis.log_summary.warnings?.length || 0}
                  />

                  <SummaryItem
                    label="Status Codes"
                    value={analysis.log_summary.status_codes?.join(", ") || "—"}
                  />
                </div>
              </ResultCard>
            )}

            {/* AI CHAT */}
            {analysisId && (
              <section className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <MessageCircle size={19} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      Ask the AI
                    </h3>

                    <p className="text-xs text-gray-500">
                      Ask follow-up questions about this incident.
                    </p>
                  </div>
                </div>

                {chatAnswer && (
                  <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-purple-400">
                      <Bot size={14} />
                      AI Support Engineer
                    </div>

                    <p className="whitespace-pre-wrap leading-7 text-gray-300">
                      {chatAnswer}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        askAI();
                      }
                    }}
                    placeholder="e.g. What should I check first?"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-500/40"
                  />

                  <button
                    onClick={askAI}
                    disabled={chatLoading || !question.trim()}
                    className="flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {chatLoading ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Send size={17} />
                    )}

                    <span className="hidden sm:inline">Ask</span>
                  </button>
                </div>
              </section>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-gray-500">
          {label}
        </p>

        <span className="text-gray-500">{icon}</span>
      </div>

      <p className="truncate text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function ResultCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="mb-4 text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/10 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export default App;