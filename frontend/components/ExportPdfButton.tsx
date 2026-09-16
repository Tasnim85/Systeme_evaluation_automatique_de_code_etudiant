"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { pdf, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "2 solid #E2001A", paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 700, color: "#121212" },
  badge: { backgroundColor: "#E2001A", color: "white", padding: "6 12", fontSize: 14, fontWeight: 700 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 6, color: "#E2001A" },
  label: { fontSize: 9, color: "#9CA3A6", marginBottom: 2 },
  code: { fontFamily: "Courier", fontSize: 9, backgroundColor: "#F6F5F4", padding: 10, lineHeight: 1.4 },
  body: { lineHeight: 1.5, color: "#121212" },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: "#9CA3A6", textAlign: "center", borderTop: "1 solid #D8D8D8", paddingTop: 8 },
});

interface Props {
  enonce: string;
  code: string;
  language: string;
  mode: "review" | "exam";
  feedback: string;
  note?: number | null;
}

function FeedbackDocument({ enonce, code, language, mode, feedback, note }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ESPRIT — Code Evaluator</Text>
            <Text style={{ fontSize: 10, color: "#9CA3A6", marginTop: 2 }}>
              {mode === "exam" ? "Mode Examen" : "Code Review"} · {language}
            </Text>
          </View>
          {mode === "exam" && note != null && <Text style={styles.badge}>{note} / 20</Text>}
        </View>

        <Text style={styles.label}>ÉNONCÉ</Text>
        <Text style={styles.body}>{enonce}</Text>

        <Text style={styles.sectionTitle}>CODE SOUMIS</Text>
        <Text style={styles.code}>{code}</Text>

        <Text style={styles.sectionTitle}>FEEDBACK</Text>
        <Text style={styles.body}>{feedback}</Text>

        <Text style={styles.footer} fixed>
          Généré par ESPRIT Code Evaluator — {new Date().toLocaleDateString("fr-FR")}
        </Text>
      </Page>
    </Document>
  );
}

export function ExportPdfButton(props: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const blob = await pdf(<FeedbackDocument {...props} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-${props.mode}-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 border border-esprit-black/20 text-sm font-medium hover:border-esprit-black transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      Exporter en PDF
    </button>
  );
}
