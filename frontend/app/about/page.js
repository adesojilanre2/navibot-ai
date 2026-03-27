export default function AboutPage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <a href="/" style={styles.link}>← Back to home</a>
        <h1 style={styles.title}>About Navibot</h1>
        <p style={styles.p}>
          Navibot is a UK healthcare navigation assistant designed to help people
          understand where to go for care using plain language.
        </p>
        <p style={styles.p}>
          It helps translate everyday questions into clearer next steps, such as
          pharmacy, GP, NHS 111, or emergency care pathways.
        </p>
        <p style={styles.p}>
          Navibot is built to make healthcare navigation easier for people who
          may be unfamiliar with NHS terms, especially newcomers to the UK.
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