import Link from "next/link";
import styles from "../page.module.css";
import { PrismaClient } from "@repo/db";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const totalEvents = await prisma.event.count();
  const totalErrorGroups = await prisma.errorGroup.count();

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
          <Link href="/analytics" className={`${styles.navItem} ${styles.active}`}>
            <span>Analytics</span>
          </Link>
          <Link href="/settings" className={styles.navItem}>
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.pageTitle}>
            <h1>Analytics</h1>
            <p className="text-secondary">Overview of your error metrics.</p>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', flex: 1, textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Total Errors Logged</h3>
              <p style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0' }}>{totalEvents}</p>
            </div>
            
            <div className="glass-panel" style={{ padding: '2rem', flex: 1, textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Unique Error Types</h3>
              <p style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0' }}>{totalErrorGroups}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
