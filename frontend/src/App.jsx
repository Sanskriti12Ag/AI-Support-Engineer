import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:8000";

function App() {
  const [errorText, setErrorText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setHistoryLoading(true);

      const response = await fetch(`${API_URL}/api/history/`);

      if (!response.ok) {
        throw new Error("Unable to load analysis history.");
      }

      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function analyzeError() {
    if (!errorText.trim()) {
      setMessage("Please enter an error or log before analyzing.");
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
          error_text: errorText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail?.[0]?.msg ||
            data.detail ||
            "Analysis failed."
        );
      }

      setAnalysis(data);
      await loadHistory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadLog(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".log")) {
      setMessage("Only .log files are supported.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Log file is too large. Maximum size is 2 MB.");
      event.target.value = "";
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setAnalysis(null);
      setChatAnswer("");

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
        throw new Error(data.detail || "Log upload failed.");
      }

      setAnalysis(data);

      const text = await file.text();
      setErrorText(text);

      await loadHistory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  async function askFollowUp(event) {
    event.preventDefault();

    if (!analysis) {
      return;
    }

    if (!chatQuestion.trim()) {
      return;
    }

    try {
      setChatLoading(true);
      setChatAnswer("");

      const response = await fetch(`${API_URL}/api/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis_id: analysis.id || history[0]?.id,
          question: chatQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to get an AI response."
        );
      }

      setChatAnswer(data.answer);
      setChatQuestion("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setChatLoading(false);
    }
  }

  function selectHistory(item) {
    setAnalysis({
      error_type: item.error_type,
      category: item.category,
      severity: item.severity,
      confidence: Number(item.confidence),
      root_cause: item.root_cause,
      explanation:
        "This analysis was loaded from saved history.",
      suggested_fix: "Review the original analysis for the complete recommendation.",
      recommended_actions: [],
      evidence: [],
      log_summary: {
        total_lines: 0,
        errors: [],
        warnings: [],
        timestamps: [],
        status_codes: [],
      },
      id: item.id,
    });

    setChatAnswer("");
    setMessage("");
  }

  function clearAnalysis() {
    setAnalysis(null);
    setChatAnswer("");
    setChatQuestion("");
    setMessage("");
  }

  const severityClass =
    analysis?.severity?.toLowerCase() || "medium";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div>
            <div className="brand-title">Support Engineer</div>
            <div className="brand-subtitle">Developer Assistant</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item active"
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            type="button"
            onClick={() =>
              document
                .getElementById("history")
                ?.scrollIntoView({ behavior: "smooth" })
            }
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
              <small>AI service connected</small>
            </div>
          </div>

          <div className="tech-stack">
            <span>FastAPI</span>
            <span>React</span>
            <span>Ollama</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI-POWERED TROUBLESHOOTING</p>
            <h1>Developer Support Center</h1>
            <p className="page-description">
              Analyze errors, understand root causes, and get actionable fixes.
            </p>
          </div>

          <div className="topbar-status">
            <span className="status-dot" />
            API Online
          </div>
        </header>

        {message && (
          <div className="alert" role="alert">
            <span>!</span>
            {message}
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        )}

        <section className="workspace">
          <div className="input-card">
            <div className="section-heading">
              <div>
                <span className="section-number">01</span>
                <div>
                  <h2>Submit an Error</h2>
                  <p>Paste an error, stack trace, or application log.</p>
                </div>
              </div>
            </div>

            <textarea
              className="error-input"
              value={errorText}
              onChange={(event) => setErrorText(event.target.value)}
              placeholder={`Example:

Connection refused while connecting to localhost:5000

or paste a complete application log / stack trace here...`}
              maxLength={50000}
            />

            <div className="input-footer">
              <span>
                {errorText.length.toLocaleString()} / 50,000 characters
              </span>

              <div className="input-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".log"
                  onChange={uploadLog}
                  hidden
                />

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  ↑ Upload .log
                </button>

                <button
                  className="primary-button"
                  type="button"
                  onClick={analyzeError}
                  disabled={loading || !errorText.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
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
          </div>

          {analysis && (
            <section className="results-section">
              <div className="results-header">
                <div>
                  <span className="section-number">02</span>
                  <div>
                    <h2>AI Analysis</h2>
                    <p>Technical diagnosis generated from your input.</p>
                  </div>
                </div>

                <button
                  className="text-button"
                  type="button"
                  onClick={clearAnalysis}
                >
                  New Analysis
                </button>
              </div>

              <div className="metrics-grid">
                <div className={`metric-card ${severityClass}`}>
                  <span className="metric-label">SEVERITY</span>
                  <strong>{analysis.severity}</strong>
                </div>

                <div className="metric-card">
                  <span className="metric-label">CATEGORY</span>
                  <strong>{analysis.category}</strong>
                </div>

                <div className="metric-card">
                  <span className="metric-label">ERROR TYPE</span>
                  <strong>{analysis.error_type}</strong>
                </div>

                <div className="metric-card">
                  <span className="metric-label">CONFIDENCE</span>
                  <strong>
                    {Math.round((analysis.confidence || 0) * 100)}%
                  </strong>
                </div>
              </div>

              <div className="analysis-grid">
                <div className="analysis-main">
                  <AnalysisBlock
                    title="Root Cause"
                    icon="◎"
                    content={analysis.root_cause}
                  />

                  <AnalysisBlock
                    title="Explanation"
                    icon="◇"
                    content={analysis.explanation}
                  />

                  <AnalysisBlock
                    title="Suggested Fix"
                    icon="✓"
                    content={analysis.suggested_fix}
                    highlighted
                  />

                  {analysis.recommended_actions?.length > 0 && (
                    <div className="analysis-block">
                      <div className="block-title">
                        <span>☑</span>
                        <h3>Recommended Actions</h3>
                      </div>

                      <div className="action-list">
                        {analysis.recommended_actions.map(
                          (action, index) => (
                            <div className="action-item" key={index}>
                              <span>{index + 1}</span>
                              <p>{action}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {analysis.evidence?.length > 0 && (
                    <div className="analysis-block">
                      <div className="block-title">
                        <span>⌁</span>
                        <h3>Evidence</h3>
                      </div>

                      <div className="evidence-list">
                        {analysis.evidence.map((item, index) => (
                          <div key={index} className="evidence-item">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <aside className="analysis-side">
                  <div className="summary-card">
                    <div className="block-title">
                      <span>▤</span>
                      <h3>Log Summary</h3>
                    </div>

                    <SummaryRow
                      label="Total Lines"
                      value={analysis.log_summary?.total_lines ?? 0}
                    />

                    <SummaryRow
                      label="Errors"
                      value={analysis.log_summary?.errors?.length ?? 0}
                    />

                    <SummaryRow
                      label="Warnings"
                      value={analysis.log_summary?.warnings?.length ?? 0}
                    />

                    <SummaryRow
                      label="Timestamps"
                      value={
                        analysis.log_summary?.timestamps?.length ?? 0
                      }
                    />

                    <SummaryRow
                      label="Status Codes"
                      value={
                        analysis.log_summary?.status_codes?.length ?? 0
                      }
                    />
                  </div>

                  <div className="chat-card">
                    <div className="chat-heading">
                      <div className="ai-avatar">AI</div>
                      <div>
                        <h3>Ask the AI</h3>
                        <p>Follow up on this diagnosis</p>
                      </div>
                    </div>

                    {chatAnswer && (
                      <div className="chat-answer">
                        {chatAnswer}
                      </div>
                    )}

                    <form onSubmit={askFollowUp}>
                      <div className="chat-input-wrapper">
                        <input
                          type="text"
                          value={chatQuestion}
                          onChange={(event) =>
                            setChatQuestion(event.target.value)
                          }
                          placeholder="Why is this happening?"
                          maxLength={5000}
                        />

                        <button
                          type="submit"
                          disabled={
                            chatLoading || !chatQuestion.trim()
                          }
                          aria-label="Ask AI"
                        >
                          {chatLoading ? "..." : "→"}
                        </button>
                      </div>
                    </form>
                  </div>
                </aside>
              </div>
            </section>
          )}

          <section className="history-section" id="history">
            <div className="section-heading">
              <div>
                <span className="section-number">03</span>
                <div>
                  <h2>Analysis History</h2>
                  <p>Your previous troubleshooting sessions.</p>
                </div>
              </div>

              <button
                className="text-button"
                type="button"
                onClick={loadHistory}
                disabled={historyLoading}
              >
                {historyLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {history.length === 0 ? (
              <div className="empty-history">
                <div className="empty-icon">◷</div>
                <h3>No analyses yet</h3>
                <p>
                  Submit your first error above and your analysis will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <button
                    className="history-item"
                    type="button"
                    key={item.id}
                    onClick={() => selectHistory(item)}
                  >
                    <div className="history-severity">
                      <span
                        className={`severity-dot ${item.severity?.toLowerCase()}`}
                      />
                      {item.severity}
                    </div>

                    <div className="history-info">
                      <strong>{item.error_type}</strong>
                      <span>{item.category}</span>
                    </div>

                    <div className="history-cause">
                      {item.root_cause}
                    </div>

                    <div className="history-date">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "Unknown"}
                    </div>

                    <span className="history-arrow">→</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </section>

        <footer className="footer">
          <span>AI Support Engineer</span>
          <span>FastAPI · React · SQLite · Ollama · Docker</span>
        </footer>
      </main>
    </div>
  );
}

function AnalysisBlock({ title, icon, content, highlighted = false }) {
  return (
    <div className={`analysis-block ${highlighted ? "highlighted" : ""}`}>
      <div className="block-title">
        <span>{icon}</span>
        <h3>{title}</h3>
      </div>

      <p>{content || "No information available."}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;