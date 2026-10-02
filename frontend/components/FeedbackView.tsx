"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Copy,
  Check,
} from "lucide-react";

interface Props {
  feedback: string;
  note?: number | null;
  mode: "review" | "exam";
  metrics?: Record<string, any> | null;
  actions?: ReactNode; // ex : <ExportPdfButton />
}

/* ---------- Découpage du feedback en sections ---------- */

type Tone = "good" | "bad" | "tip" | "neutral";
interface Section {
  title: string | null;
  body: string;
  tone: Tone;
}

function toneFor(title: string): Tone {
  const t = title.toLowerCase();
  if (/(fort|positif|r[ée]ussi|bien|bravo|qualit[ée]s)/.test(t)) return "good";
  if (/(am[ée]lior|faibl|probl[èe]me|erreur|bug|d[ée]faut|manque|point.*(vigilance|attention))/.test(t))
    return "bad";
  if (/(conseil|suggestion|recommand|prochain|pour aller|piste)/.test(t)) return "tip";
  return "neutral";
}

function parseSections(feedback: string): Section[] {
  const lines = feedback.split("\n");
  const sections: Section[] = [];
  let current: Section = { title: null, body: "", tone: "neutral" };

  for (const line of lines) {
    const m = line.match(/^#{1,3}\s+(.*)$/);
    if (m) {
      if (current.title !== null || current.body.trim()) sections.push(current);
      const title = m[1].replace(/\*\*/g, "").trim();
      current = { title, body: "", tone: toneFor(title) };
    } else {
      current.body += line + "\n";
    }
  }
  if (current.title !== null || current.body.trim()) sections.push(current);
  return sections;
}

/* ---------- Styles par ton ---------- */

const TONES: Record<
  Tone,
  { bar: string; text: string; bg: string; Icon: typeof FileText }
> = {
  good: { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", Icon: CheckCircle2 },
  bad: { bar: "bg-esprit-red", text: "text-esprit-red", bg: "bg-red-50", Icon: AlertTriangle },
  tip: { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", Icon: Lightbulb },
  neutral: { bar: "bg-esprit-charcoal", text: "text-esprit-black", bg: "bg-esprit-offwhite", Icon: FileText },
};

/* ---------- Markdown stylé ---------- */

const mdComponents: any = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }: any) => <ul className="mb-3 space-y-2 last:mb-0">{children}</ul>,
  ol: ({ children }: any) => (
    <ol className="mb-3 list-decimal space-y-2 pl-5 last:mb-0 marker:font-semibold marker:text-esprit-red">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="relative pl-5 [ol_&]:pl-1 before:absolute before:left-0 before:top-[0.7em] before:h-1.5 before:w-1.5 before:bg-esprit-red [ol_&]:before:hidden">
      {children}
    </li>
  ),
  strong: ({ children }: any) => <strong className="font-semibold text-esprit-black">{children}</strong>,
  h4: ({ children }: any) => (
    <h4 className="mb-2 mt-4 font-display text-sm font-semibold uppercase tracking-wide text-esprit-black/60">
      {children}
    </h4>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="my-3 border-l-4 border-esprit-black/20 bg-esprit-offwhite px-4 py-2 text-esprit-black/70">
      {children}
    </blockquote>
  ),
  pre: ({ children }: any) => (
    <pre className="my-3 overflow-x-auto bg-esprit-charcoal p-4 text-xs leading-relaxed text-gray-100">
      {children}
    </pre>
  ),
  code: ({ className, children }: any) => {
    const isBlock = /language-/.test(className || "") || String(children).includes("\n");
    return isBlock ? (
      <code className="font-mono">{children}</code>
    ) : (
      <code className="bg-esprit-offwhite px-1.5 py-0.5 font-mono text-[0.85em] text-esprit-red">
        {children}
      </code>
    );
  },
  table: ({ children }: any) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="border-b border-esprit-black/15 px-3 py-2 font-semibold">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="border-b border-esprit-black/10 px-3 py-2">{children}</td>
  ),
};

/* ---------- Note en cercle ---------- */

function ScoreRing({ note }: { note: number }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(20, note)) / 20;
  const color = note >= 14 ? "#059669" : note >= 10 ? "#D97706" : "#E2001A";
  const label =
    note >= 16 ? "Excellent" : note >= 14 ? "Très bien" : note >= 12 ? "Bien" : note >= 10 ? "Passable" : "À retravailler";

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
          <motion.circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="butt"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - pct) }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <span className="font-display text-3xl font-bold leading-none">{note}</span>
          <span className="text-xs text-white/60">/ 20</span>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-white/50">Résultat</p>
        <p className="font-display text-2xl font-semibold text-white">{label}</p>
      </div>
    </div>
  );
}

/* ---------- Puces de métriques ---------- */

function Chip({ label, value, danger }: { label: string; value: any; danger?: boolean }) {
  if (value === undefined || value === null) return null;
  return (
    <span
      className={`px-3 py-1.5 text-xs ${
        danger ? "bg-red-100 text-esprit-red" : "bg-white/10 text-white/80"
      }`}
    >
      {label} <strong className="ml-1">{value}</strong>
    </span>
  );
}

/* ---------- Composant principal ---------- */

export function FeedbackView({ feedback, note, mode, metrics, actions }: Props) {
  const sections = useMemo(() => parseSections(feedback), [feedback]);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedback);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const hasNote = mode === "exam" && note != null;

  return (
    <div className="space-y-5">
      {/* ---------- Bandeau résultat ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="cut-corner bg-esprit-charcoal p-6 md:p-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          {hasNote ? (
            <ScoreRing note={note as number} />
          ) : (
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Code review</p>
              <p className="font-display text-2xl font-semibold text-white">
                Analyse terminée
              </p>
              <p className="mt-1 text-sm text-white/60">Sans note, pour t'entraîner.</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 [&_button]:inline-flex [&_button]:items-center [&_button]:gap-2 [&_button]:border [&_button]:border-white/20 [&_button]:bg-white [&_button]:px-4 [&_button]:py-2 [&_button]:text-sm [&_button]:font-medium [&_button]:!text-esprit-black [&_button]:transition-colors [&_button:hover]:bg-esprit-red [&_button:hover]:!text-white [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2 [&_a]:border [&_a]:border-white/20 [&_a]:bg-white [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:!text-esprit-black [&_a:hover]:bg-esprit-red [&_a:hover]:!text-white">
  <button type="button" onClick={copy}>
    {copied ? <Check size={16} /> : <Copy size={16} />}
    {copied ? "Copié" : "Copier"}
  </button>
  {actions}
</div>
            </div>
        </div>

        {metrics && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <Chip label="Lignes" value={metrics.num_lines} />
            <Chip label="Fonctions" value={metrics.num_functions} />
            <Chip label="Classes" value={metrics.num_classes} />
            <Chip label="Bugs" value={metrics.sonar_bugs} danger={metrics.sonar_bugs > 0} />
            <Chip
              label="Vulnérabilités"
              value={metrics.sonar_vulnerabilities}
              danger={metrics.sonar_vulnerabilities > 0}
            />
            <Chip label="Code smells" value={metrics.sonar_code_smells} />
          </div>
        )}
      </motion.div>

      {/* ---------- Sections du feedback ---------- */}
      {sections.map((s, i) => {
        const tone = TONES[s.tone];
        const Icon = tone.Icon;
        return (
          <motion.section
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + i * 0.1, ease: "easeOut" }}
            className="cut-corner flex bg-white"
          >
            <div className={`w-1.5 shrink-0 ${tone.bar}`} />
            <div className="min-w-0 flex-1 p-5 md:p-6">
              {s.title && (
                <div className="mb-3 flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center ${tone.bg} ${tone.text}`}>
                    <Icon size={17} />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-esprit-black">
                    {s.title}
                  </h3>
                </div>
              )}
              <div className="text-sm text-esprit-black/85">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {s.body.trim()}
                </ReactMarkdown>
              </div>
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}