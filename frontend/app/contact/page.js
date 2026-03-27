export default function PrivacyPage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <a href="/" style={styles.link}>← Back to home</a>
        <h1 style={styles.title}>Privacy</h1>
        <p style={styles.p}>
          Navibot provides general health information and navigation guidance.
        </p>
        <p style={styles.p}>
          Questions entered into the system may be logged for product improvement,
          analytics, and quality review.
        </p>
        <p style={styles.p}>
          Waitlist emails are stored separately for product updates.
        </p>
        <p style={styles.p}>
          Navibot is not a diagnosis service and should not be used in place of
          urgent emergency medical care.
        </p>
        <p style={styles.p}>
          For a production launch, this privacy page should be reviewed and expanded
          with formal legal and compliance language.
        </p>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#F8FAFC",
    padding: "40px 16px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#111827",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
  },
  title: {
    fontSize: "42px",
    fontWeight: 800,
    marginBottom: "18px",
  },
  p: {
    fontSize: "16px",
    lineHeight: 1.8,
    color: "#475569",
    marginBottom: "14px",
  },
  link: {
    display: "inline-block",
    marginBottom: "18px",
    textDecoration: "none",
    color: "#2563EB",
    fontWeight: 700,
  },
};