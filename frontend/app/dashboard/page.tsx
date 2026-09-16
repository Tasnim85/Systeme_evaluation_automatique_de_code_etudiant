"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileCode2, GraduationCap, ArrowRight, BookPlus } from "lucide-react";
import { api } from "@/lib/api";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function DashboardOverview() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    api.profile().then(setProfile).catch(() => {});
  }, []);

  if (!profile) return <LoadingScreen />;

  if (profile.role === "enseignant") {
    return (
      <div className="p-8 md:p-12 max-w-5xl">
        <h1 className="font-display font-semibold text-3xl text-esprit-black">
          Bonjour, {profile.prenom} 👋
        </h1>
        <p className="mt-2 text-esprit-black/60">
          Gère tes classes et assigne des exercices à tes étudiants.
        </p>

        <Link
          href="/dashboard/teacher/exercises"
          className="group mt-10 block cut-corner bg-esprit-red text-white p-8 max-w-md hover:bg-esprit-red-dark hover:-translate-y-1 hover:shadow-xl transition-all"
        >
          <BookPlus size={28} />
          <h2 className="mt-4 font-display font-semibold text-xl">Mes exercices</h2>
          <p className="mt-3 text-white/85 leading-relaxed">
            Crée des classes et assigne des exercices de Code Review ou d'Examen.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white group-hover:gap-3 transition-all">
            Y aller <ArrowRight size={16} />
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-5xl">
      <h1 className="font-display font-semibold text-3xl text-esprit-black">
        Salut, {profile.prenom} 👋
      </h1>
      <p className="mt-2 text-esprit-black/60">
        {profile.classe ? `Classe ${profile.classe} · ` : ""}Choisis un mode pour soumettre
        ton code.
      </p>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/review"
          className="group cut-corner bg-esprit-charcoal text-white p-8 hover:bg-esprit-black hover:-translate-y-1 hover:shadow-xl transition-all"
        >
          <FileCode2 className="text-esprit-red" size={28} />
          <h2 className="mt-4 font-display font-semibold text-xl">Code Review</h2>
          <p className="mt-3 text-white/70 leading-relaxed">
            Entraîne-toi librement, feedback détaillé sans note.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-esprit-red group-hover:gap-3 transition-all">
            Commencer <ArrowRight size={16} />
          </span>
        </Link>

        <Link
          href="/dashboard/exam"
          className="group cut-corner bg-esprit-red text-white p-8 hover:bg-esprit-red-dark hover:-translate-y-1 hover:shadow-xl transition-all"
        >
          <GraduationCap size={28} />
          <h2 className="mt-4 font-display font-semibold text-xl">Mode Examen</h2>
          <p className="mt-3 text-white/85 leading-relaxed">
            Feedback complet avec une note sur 20 justifiée.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white group-hover:gap-3 transition-all">
            Commencer <ArrowRight size={16} />
          </span>
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
        <Stat label="Soumissions" value={profile.total_submissions ?? 0} />
        <Stat label="Examens passés" value={profile.total_exams ?? 0} />
        <Stat
          label="Moyenne examens"
          value={profile.average_note != null ? `${profile.average_note}/20` : "—"}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-4 cut-corner-sm">
      <p className="text-2xl font-display font-semibold text-esprit-black">{value}</p>
      <p className="text-xs text-esprit-black/60 mt-1">{label}</p>
    </div>
  );
}
