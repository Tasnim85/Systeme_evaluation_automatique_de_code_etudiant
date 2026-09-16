"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    api.profile().then(setProfile);
  }, []);

  if (!profile) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-8 md:p-12 max-w-3xl">
      <h1 className="font-display font-semibold text-3xl text-esprit-black">Mon profil</h1>

      <div className="mt-8 bg-white cut-corner p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-esprit-red text-white flex items-center justify-center font-display font-semibold text-2xl">
          {profile.prenom?.[0]}
          {profile.nom?.[0]}
        </div>
        <div>
          <p className="font-display font-semibold text-lg text-esprit-black">
            {profile.prenom} {profile.nom}
          </p>
          <p className="text-sm text-esprit-black/60">{profile.email}</p>
          <p className="text-xs text-esprit-black/40 mt-1">
            Membre depuis {new Date(profile.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>

      <h2 className="mt-10 font-display font-semibold text-xl text-esprit-black">
        Statistiques
      </h2>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Stat label="Soumissions totales" value={profile.total_submissions ?? 0} />
        <Stat label="Examens passés" value={profile.total_exams ?? 0} />
        <Stat
          label="Moyenne examens"
          value={profile.average_note != null ? `${profile.average_note}/20` : "—"}
        />
      </div>

      {profile.languages_breakdown && (
        <>
          <h2 className="mt-10 font-display font-semibold text-xl text-esprit-black">
            Répartition par langage
          </h2>
          <div className="mt-4 space-y-2">
            {Object.entries(profile.languages_breakdown as Record<string, number>).map(
              ([lang, count]) => (
                <div key={lang} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-esprit-black/70 capitalize">{lang}</span>
                  <div className="flex-1 h-2 bg-esprit-offwhite">
                    <div
                      className="h-2 bg-esprit-red"
                      style={{
                        width: `${(count / profile.total_submissions) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-esprit-black/50 w-6 text-right">{count}</span>
                </div>
              )
            )}
          </div>
        </>
      )}
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
