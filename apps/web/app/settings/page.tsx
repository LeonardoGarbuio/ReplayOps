import Link from "next/link";
import styles from "../page.module.css";
import { PrismaClient } from "@repo/db";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const project = await prisma.project.findFirst();

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}></div>
          <h2 className="gradient-text">ReplayOps</h2>
        </div>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navItem}>
            <span>Inbox</span>
          </Link>
          <Link href="/analytics" className={styles.navItem}>
            <span>Analytics</span>
          </Link>
          <Link href="/settings" className={`${styles.navItem} ${styles.active}`}>
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.pageTitle}>
            <h1>Settings</h1>
            <p className="text-secondary">Manage your project and API keys.</p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Project Configuration</h3>
            
            {project ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Project Name</label>
                  <div style={{ padding: '10px 16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    {project.name}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Project ID</label>
                  <div style={{ padding: '10px 16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>
                    {project.id}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>API Key</label>
                  <div style={{ padding: '10px 16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>
                    {project.apiKey}
                  </div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Use this API key in your <code>replayops-sdk-node</code> configuration.
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No project found. Send your first error via SDK to auto-create one.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
