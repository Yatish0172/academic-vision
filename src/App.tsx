import React, { useCallback, useEffect, useState } from "react";
import { api, type Health, type User } from "./api";
import { NavigationTab } from "./types";
import { Sidebar } from "./components/Sidebar";
import {
  AuditModal,
  ConnectedWorkspace,
  Login,
} from "./components/ConnectedWorkspace";

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<NavigationTab>("dashboard");
  const [version, setVersion] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [audit, setAudit] = useState(false);
  const [toast, setToast] = useState("");
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const notify = useCallback((text: string) => setToast(text), []);
  async function load() {
    setLoading(true);
    setError("");
    try {
      setHealth(await api<Health>("/health"));
      try {
        setUser(await api<User>("/auth/me"));
      } catch {
        setUser(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot reach the backend.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    const expired = () => {
      setUser(null);
      setToast("Your session expired. Please sign in again.");
    };
    window.addEventListener("auth-expired", expired);
    return () => window.removeEventListener("auth-expired", expired);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    api<{ pending_reviews: number }>(
      "/dashboard",
      "GET",
      undefined,
      controller.signal,
    )
      .then((data) => setReviewCount(data.pending_reviews))
      .catch(() => {});
    return () => controller.abort();
  }, [version, user]);
  if (loading)
    return <div className="login-page">Connecting to Academic Vision…</div>;
  if (error || !health)
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Backend unavailable</h1>
          <p role="alert">{error || "Start the API server to continue."}</p>
          <button className="primary" onClick={() => void load()}>
            Retry connection
          </button>
        </div>
      </div>
    );
  if (!user)
    return (
      <Login
        health={health}
        onLogin={(u) => {
          setUser(u);
          setHealth({ ...health, setup_required: false });
          setTab("dashboard");
          refresh();
        }}
      />
    );
  return (
    <div className="app-shell">
      <Sidebar
        currentTab={tab}
        onSelectTab={setTab}
        reviewPendingCount={reviewCount}
      />
      <header className="app-header">
        <div>
          <strong>Academic Vision</strong>
          <small>
            {new Date().toLocaleDateString(undefined, { dateStyle: "long" })}
          </small>
        </div>
        <div className="row-actions">
          {user.role === "ADMIN" && (
            <button onClick={() => setAudit(true)}>Audit log</button>
          )}
          <span>
            {user.name}
            <small>{user.role}</small>
          </span>
          <button
            onClick={() => {
              void api("/auth/logout", "POST")
                .then(() => {
                  setUser(null);
                  setAudit(false);
                })
                .catch((e) => notify(e.message));
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="app-main">
        <ConnectedWorkspace
          tab={tab}
          user={user}
          health={health}
          version={version}
          refresh={refresh}
          notify={notify}
          onNavigate={setTab}
          onReviewCount={setReviewCount}
        />
      </main>
      {audit && <AuditModal close={() => setAudit(false)} version={version} />}
      <div aria-live="polite">
        {toast && (
          <div className="app-toast" role="status">
            {toast}
            <button
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
