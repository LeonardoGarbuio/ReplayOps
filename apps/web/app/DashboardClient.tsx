"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return Math.floor(seconds) + " seconds ago";
}

export default function DashboardClient({ errorGroups }: { errorGroups: any[] }) {
  const [selectedGroup, setSelectedGroup] = useState<any | null>(errorGroups[0] || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<any | null>(null);

  const filteredGroups = errorGroups.filter((group) => 
    group.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReplay = async () => {
    if (!selectedGroup) return;
    
    setIsReplaying(true);
    try {
      const event = selectedGroup.events?.[0];
      const payload = event?.payload ? JSON.parse(event.payload) : undefined;
      const headers = event?.headers ? JSON.parse(event.headers) : undefined;
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const targetUrl = process.env.NEXT_PUBLIC_REPLAY_TARGET_URL || "http://localhost:3002";

      const response = await fetch(`${apiUrl}/api/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedGroup.method,
          url: `${targetUrl}${selectedGroup.route}`, // Apontando para o nosso test-sdk ou target real
          headers: headers,
          data: payload
        })
      });

      const result = await response.json();
      setReplayResult(result);
    } catch (err: any) {
      console.error("❌ Falha na requisição de replay:", err);
      setReplayResult({ status: 'Error', data: err.message, headers: {} });
    } finally {
      setIsReplaying(false);
    }
  };

  const formatPayload = (str: string) => {
    if (!str) return "{}";
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}></div>
          <h2 className="gradient-text">ReplayOps</h2>
        </div>
        <nav className={styles.nav}>
          <Link href="/" className={`${styles.navItem} ${styles.active}`}>
            <span>Inbox</span>
          </Link>
          <Link href="/analytics" className={styles.navItem}>
            <span>Analytics</span>
          </Link>
          <Link href="/settings" className={styles.navItem}>
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerSearch}>
            <input 
              type="text" 
              placeholder="Search events, routes..." 
              className={styles.searchInput} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.headerProfile}>
            <div className={styles.avatar}>D</div>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.pageTitle}>
            <h1>Error Inbox</h1>
            <p className="text-secondary">Recent failures detected in production.</p>
          </div>

          <div className={`${styles.inboxGrid} animate-fade-in`}>
            {/* List of errors */}
            <div className={`${styles.errorList} glass-panel`}>
              <div className={styles.listHeader}>
                <div>Method/Route</div>
                <div>Occurrences</div>
                <div>Last Seen</div>
              </div>
              {filteredGroups.length === 0 ? (
                <div style={{ padding: '1rem', color: '#888' }}>No errors found! You are safe.</div>
              ) : null}
              {filteredGroups.map((group) => (
                <div 
                  key={group.id} 
                  className={styles.listItem} 
                  style={{ cursor: 'pointer', background: selectedGroup?.id === group.id ? 'rgba(255,255,255,0.05)' : '' }}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className={styles.itemRoute}>
                    <span className={`${styles.badge} ${group.method === 'POST' ? styles.badgePost : styles.badgeGet}`}>
                      {group.method}
                    </span>
                    <span>{group.route}</span>
                  </div>
                  <div className={styles.itemCount}>{group._count.events}</div>
                  <div className={styles.itemDate}>{timeAgo(new Date(group.updatedAt))}</div>
                </div>
              ))}
            </div>

            {/* Error Details Preview */}
            <div className={`${styles.errorDetails} glass-panel`}>
              {selectedGroup ? (
                <>
                  <div className={styles.detailsHeader}>
                    <h3>{selectedGroup.message}</h3>
                    <button 
                      className={styles.primaryButton} 
                      onClick={handleReplay} 
                      disabled={isReplaying}
                    >
                      {isReplaying ? "Replaying..." : "Replay Event"}
                    </button>
                  </div>
                  <div className={styles.detailsBody}>
                    <p>Fingerprint: <code>{selectedGroup.fingerprint}</code></p>
                    <div className={styles.codeBlock}>
                      <pre><code>{`${selectedGroup.method} ${selectedGroup.route} HTTP/1.1\n\nPayload:\n${formatPayload(selectedGroup.events?.[0]?.payload)}`}</code></pre>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '2rem', color: '#888', textAlign: 'center' }}>
                  Select an error to view details.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Replay Result Modal */}
      {replayResult && (
        <div className={styles.modalOverlay} onClick={() => setReplayResult(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                Replay Result
                <span className={styles.statusBadge} style={{
                  backgroundColor: String(replayResult.status).startsWith('2') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: String(replayResult.status).startsWith('2') ? '#10b981' : '#ef4444'
                }}>
                  {replayResult.status}
                </span>
              </h2>
              <button className={styles.closeButton} onClick={() => setReplayResult(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Response Headers</h4>
                <div className={styles.codeBlock}>
                  <pre>{JSON.stringify(replayResult.headers, null, 2) || "{}"}</pre>
                </div>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Response Body</h4>
                <div className={styles.codeBlock} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>
                    {typeof replayResult.data === 'string' ? replayResult.data : JSON.stringify(replayResult.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
