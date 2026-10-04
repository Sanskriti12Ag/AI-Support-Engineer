import { useEffect, useMemo, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const [errorText, setErrorText] = useState("");
  const [analysis, setAnalysis] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [fileName, setFileName] = useState("");

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);

      const response = await fetch(`${API_URL}/api/history/`);

      if (!response.ok) {
        throw new Error("Failed to load analysis history.");
      }

      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(
        error.message || "Unable to load analysis history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const analyzeError = async () => {
    if (!errorText.trim()) {
      setMessage("Paste an error or log before analyzing.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setAnalysis(null);
      setChatAnswer("");

      const response = await fetch(`${API_URL}/api/analysis/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error_text: errorText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to analyze the error."
        );
      }

      setAnalysis(data);
      await loadHistory();

    } catch (error) {
      setMessage(
        error.message || "Something went wrong while analyzing."
      );
    } finally {
      setLoading(false);
    }
  };

  const uploadLog = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setChatAnswer("");

    if (!file.name.toLowerCase().endsWith(".log")) {
      setMessage("Only .log files are supported.");
      event.target.value = "";
      return;
    }

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage("Log file is too large. Maximum size is 2 MB.");
      event.target.value = "";
      return;
    }

    setFileName(file.name);

    try {
      setLoading(true);
      setAnalysis(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/analysis/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to analyze the log file."
        );
      }

      setAnalysis(data);
      setErrorText(data.original_input || "");

      await loadHistory();

    } catch (error) {
      setMessage(
        error.message || "Failed to upload the log file."
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const selectHistory = async (item) => {
    try {
      setMessage("");
      setChatAnswer("");
      setActivePage("dashboard");

      const response = await fetch(
        `${API_URL}/api/history/${item.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load analysis."
        );
      }

      setAnalysis(data);
      setErrorText(data.original_input || "");
      setFileName("");

    } catch (error) {
      setMessage(
        error.message || "Failed to load history item."
      );
    }
  };

  const askFollowUp = async () => {
    if (!chatQuestion.trim()) {
      setMessage("Please enter a question.");
      return;
    }

    const analysisId = analysis?.id;

    if (!analysisId) {
      setMessage(
        "Please run or select an analysis first."
      );
      return;
    }

    try {
      setChatLoading(true);
      setChatAnswer("");
      setMessage("");

      const response = await fetch(`${API_URL}/api/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis_id: analysisId,
          question: chatQuestion.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to get AI response."
        );
      }

      setChatAnswer(data.answer);
      setChatQuestion("");

    } catch (error) {
      setMessage(
        error.message || "Failed to get AI response."
      );
    } finally {
      setChatLoading(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysis(null);
    setErrorText("");
    setFileName("");
    setChatAnswer("");
    setChatQuestion("");
    setMessage("");
  };

  const severityClass = useMemo(() => {
    if (!analysis?.severity) {
      return "";
    }

    return analysis.severity.toLowerCase();
  }, [analysis]);

  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  const categoryIcon = {
    Database: "▣",
    API: "↗",
    Network: "⌁",
    Application: "◆",
    Authentication: "◉",
    Configuration: "⚙",
    Other: "•",
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            AI
          </div>

          <div>
            <h1>Support Engineer</h1>
            <span>Developer Troubleshooting</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={
              activePage === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            type="button"
            className={
              activePage === "history"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("history")}
          >
            <span>◷</span>
            History
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="status-dot" />
            <div>
              <strong>System Online</strong>
              <small>AI engine connected</small>
            </div>
          </div>

          <div className="sidebar-tech">
            <span>FastAPI</span>
            <span>React</span>
            <span>Ollama</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">
              AI-POWERED DEVELOPER TOOL
            </div>

            <h2>
              {activePage === "history"
                ? "Analysis History"
                : "Troubleshoot with AI"}
            </h2>
          </div>

          <div className="topbar-status">
            <span className="status-dot" />
            Local AI
          </div>
        </header>

        {message && (
          <div className="message-banner">
            <span>!</span>
            <p>{message}</p>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {activePage === "history" ? (
          <section className="history-page">
            <div className="page-intro">
              <div>
                <span className="section-kicker">
                  PAST ANALYSES
                </span>

                <h3>Your troubleshooting history</h3>

                <p>
                  Review previous investigations and reopen
                  their complete AI analysis.
                </p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={loadHistory}
              >
                ↻ Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="empty-state">
                <div className="loader" />
                <p>Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◷</div>
                <h3>No analyses yet</h3>
                <p>
                  Your completed troubleshooting sessions
                  will appear here.
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    setActivePage("dashboard")
                  }
                >
                  Start an Analysis
                </button>
              </div>
            ) : (
              <div className="history-grid">
                {history.map((item) => (
                  <button
                    type="button"
                    className="history-card"
                    key={item.id}
                    onClick={() => selectHistory(item)}
                  >
                    <div className="history-card-top">
                      <div className="history-category">
                        <span>
                          {categoryIcon[item.category] || "•"}
                        </span>

                        {item.category}
                      </div>

                      <span
                        className={`severity-badge ${(
                          item.severity || ""
                        ).toLowerCase()}`}
                      >
                        {item.severity}
                      </span>
                    </div>

                    <h3>
                      {item.error_type ||
                        "Untitled analysis"}
                    </h3>

                    <p>
                      {item.root_cause ||
                        "No root cause available."}
                    </p>

                    <div className="history-card-footer">
                      <span>
                        Analysis #{item.id}
                      </span>

                      <span>
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="hero-section">
              <div className="hero-copy">
                <div className="hero-badge">
                  <span className="pulse-dot" />
                  AI TROUBLESHOOTING ENGINE
                </div>

                <h3>
                  Turn confusing errors into
                  <span> actionable fixes.</span>
                </h3>

                <p>
                  Paste an error or upload a log. The
                  troubleshooting engine combines deterministic
                  signal detection with AI reasoning to identify
                  probable causes, evidence, and next steps.
                </p>
              </div>

              <div className="hero-orb">
                <div className="orb-ring ring-one" />
                <div className="orb-ring ring-two" />
                <div className="orb-core">
                  <span>AI</span>
                </div>
              </div>
            </section>

            <section className="workspace">
              <div className="input-card">
                <div className="card-header">
                  <div>
                    <span className="section-kicker">
                      INPUT
                    </span>

                    <h3>What went wrong?</h3>
                  </div>

                  {fileName && (
                    <div className="file-pill">
                      <span>▤</span>
                      {fileName}
                    </div>
                  )}
                </div>

                <textarea
                  value={errorText}
                  onChange={(event) =>
                    setErrorText(event.target.value)
                  }
                  placeholder={`Paste your error message, stack trace, or application logs here...

Example:
ConnectionError: connection refused to localhost:5432
  at database.connect()
  at application.start()`}
                  maxLength={50000}
                />

                <div className="input-footer">
                  <label className="upload-button">
                    <input
                      type="file"
                      accept=".log"
                      onChange={uploadLog}
                    />
                    <span>↑</span>
                    Upload .log
                  </label>

                  <div className="input-meta">
                    {errorText.length.toLocaleString()} / 50,000
                    characters
                  </div>

                  <button
                    type="button"
                    className="primary-button analyze-button"
                    onClick={analyzeError}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="button-loader" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Error
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {analysis && (
              <section className="results-section">
                <div className="results-header">
                  <div>
                    <span className="section-kicker">
                      ANALYSIS RESULT
                    </span>

                    <h3>
                      Troubleshooting Report
                    </h3>

                    <p>
                      Analysis #{analysis.id || "—"} ·
                      Generated by the AI troubleshooting
                      workflow
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={clearAnalysis}
                  >
                    New Analysis
                  </button>
                </div>

                <div className="metrics-grid">
                  <div className="metric-card">
                    <span className="metric-label">
                      CATEGORY
                    </span>

                    <strong>
                      {analysis.category}
                    </strong>

                    <small>
                      {categoryIcon[analysis.category] ||
                        "•"} Detected category
                    </small>
                  </div>

                  <div className="metric-card">
                    <span className="metric-label">
                      SEVERITY
                    </span>

                    <strong
                      className={`severity-text ${severityClass}`}
                    >
                      {analysis.severity}
                    </strong>

                    <small>
                      Incident impact assessment
                    </small>
                  </div>

                  <div className="metric-card">
                    <span className="metric-label">
                      CONFIDENCE
                    </span>

                    <strong>
                      {Math.round(
                        Number(analysis.confidence || 0) *
                          100
                      )}
                      %
                    </strong>

                    <small>
                      AI reasoning confidence
                    </small>
                  </div>

                  <div className="metric-card">
                    <span className="metric-label">
                      SIGNALS
                    </span>

                    <strong>
                      {analysis.detected_signals?.length ||
                        0}
                    </strong>

                    <small>
                      Technical patterns detected
                    </small>
                  </div>
                </div>

                <div className="analysis-main-grid">
                  <div className="analysis-column">
                    <section className="analysis-card primary-analysis">
                      <div className="analysis-card-title">
                        <div className="title-icon">
                          ◉
                        </div>

                        <div>
                          <span>ROOT CAUSE</span>
                          <h3>Probable cause</h3>
                        </div>
                      </div>

                      <p className="root-cause-text">
                        {analysis.root_cause}
                      </p>
                    </section>

                    <section className="analysis-card">
                      <div className="analysis-card-title">
                        <div className="title-icon">
                          ≡
                        </div>

                        <div>
                          <span>EXPLANATION</span>
                          <h3>What is happening?</h3>
                        </div>
                      </div>

                      <p className="analysis-body">
                        {analysis.explanation}
                      </p>
                    </section>

                    {analysis.hypotheses?.length > 0 && (
                      <section className="analysis-card">
                        <div className="analysis-card-title">
                          <div className="title-icon">
                            🧠
                          </div>

                          <div>
                            <span>REASONING</span>
                            <h3>
                              Possible root-cause
                              hypotheses
                            </h3>
                          </div>
                        </div>

                        <p className="analysis-subtitle">
                          Candidate causes identified during
                          the troubleshooting workflow.
                        </p>

                        <div className="analysis-list">
                          {analysis.hypotheses.map(
                            (hypothesis, index) => (
                              <div
                                className="analysis-list-item"
                                key={index}
                              >
                                <span>{index + 1}</span>
                                <p>{hypothesis}</p>
                              </div>
                            )
                          )}
                        </div>
                      </section>
                    )}

                    {analysis.detected_signals?.length >
                      0 && (
                      <section className="analysis-card">
                        <div className="analysis-card-title">
                          <div className="title-icon">
                            🔎
                          </div>

                          <div>
                            <span>RULE ENGINE</span>
                            <h3>
                              Detected technical signals
                            </h3>
                          </div>
                        </div>

                        <p className="analysis-subtitle">
                          Deterministic patterns detected
                          before AI reasoning.
                        </p>

                        <div className="signal-list">
                          {analysis.detected_signals.map(
                            (signal) => (
                              <span
                                className="signal-chip"
                                key={signal}
                              >
                                {signal}
                              </span>
                            )
                          )}
                        </div>
                      </section>
                    )}

                    <section className="analysis-card">
                      <div className="analysis-card-title">
                        <div className="title-icon">
                          ✓
                        </div>

                        <div>
                          <span>RECOMMENDED FIX</span>
                          <h3>Suggested solution</h3>
                        </div>
                      </div>

                      <p className="analysis-body">
                        {analysis.suggested_fix}
                      </p>
                    </section>
                  </div>

                  <div className="analysis-column">
                    <section className="analysis-card">
                      <div className="analysis-card-title">
                        <div className="title-icon">
                          →
                        </div>

                        <div>
                          <span>ACTIONS</span>
                          <h3>Recommended steps</h3>
                        </div>
                      </div>

                      <div className="action-list">
                        {analysis.recommended_actions?.map(
                          (action, index) => (
                            <div
                              className="action-item"
                              key={index}
                            >
                              <span>{index + 1}</span>
                              <p>{action}</p>
                            </div>
                          )
                        )}
                      </div>
                    </section>

                    <section className="analysis-card">
                      <div className="analysis-card-title">
                        <div className="title-icon">
                          ⌕
                        </div>

                        <div>
                          <span>EVIDENCE</span>
                          <h3>Supporting evidence</h3>
                        </div>
                      </div>

                      <div className="evidence-list">
                        {analysis.evidence?.length > 0 ? (
                          analysis.evidence.map(
                            (item, index) => (
                              <div
                                className="evidence-item"
                                key={index}
                              >
                                <span>•</span>
                                <p>{item}</p>
                              </div>
                            )
                          )
                        ) : (
                          <p className="muted">
                            No evidence was returned.
                          </p>
                        )}
                      </div>
                    </section>

                    {analysis.log_summary && (
                      <section className="analysis-card">
                        <div className="analysis-card-title">
                          <div className="title-icon">
                            ▤
                          </div>

                          <div>
                            <span>LOG ANALYSIS</span>
                            <h3>Log summary</h3>
                          </div>
                        </div>

                        <div className="log-stats">
                          <div>
                            <strong>
                              {analysis.log_summary
                                .total_lines || 0}
                            </strong>
                            <span>Lines</span>
                          </div>

                          <div>
                            <strong>
                              {analysis.log_summary.errors
                                ?.length || 0}
                            </strong>
                            <span>Errors</span>
                          </div>

                          <div>
                            <strong>
                              {analysis.log_summary.warnings
                                ?.length || 0}
                            </strong>
                            <span>Warnings</span>
                          </div>

                          <div>
                            <strong>
                              {analysis.log_summary
                                .status_codes?.length || 0}
                            </strong>
                            <span>Status Codes</span>
                          </div>
                        </div>
                      </section>
                    )}

                    <section className="analysis-card ask-ai-card">
                      <div className="analysis-card-title">
                        <div className="title-icon ai-icon">
                          AI
                        </div>

                        <div>
                          <span>FOLLOW-UP</span>
                          <h3>Ask the AI</h3>
                        </div>
                      </div>

                      <p className="analysis-subtitle">
                        Ask a follow-up question about this
                        specific investigation.
                      </p>

                      <div className="chat-input-row">
                        <input
                          type="text"
                          value={chatQuestion}
                          onChange={(event) =>
                            setChatQuestion(
                              event.target.value
                            )
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              askFollowUp();
                            }
                          }}
                          placeholder="Why is this happening?"
                          maxLength={5000}
                        />

                        <button
                          type="button"
                          className="primary-button"
                          onClick={askFollowUp}
                          disabled={chatLoading}
                        >
                          {chatLoading
                            ? "Thinking..."
                            : "Ask"}
                        </button>
                      </div>

                      {chatAnswer && (
                        <div className="chat-answer">
                          <div className="chat-answer-label">
                            AI RESPONSE
                          </div>

                          <p>{chatAnswer}</p>
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;