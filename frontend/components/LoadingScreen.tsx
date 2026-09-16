"use client";

import Image from "next/image";

interface Props {
  message?: string;
  overlay?: boolean; // true = superpose au contenu existant (analyse en cours), false = plein écran (navigation)
}

export function LoadingScreen({ message, overlay = false }: Props) {
  return (
    <div
      className={
        overlay
          ? "fixed inset-0 z-50 flex items-center justify-center bg-esprit-offwhite/90 backdrop-blur-sm"
          : "fixed inset-0 z-50 flex items-center justify-center bg-esprit-offwhite"
      }
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <Image
            src="/esprit-logo.png"
            alt="ESPRIT"
            width={190}
            height={100}
            priority
            className="h-14 w-auto animate-[pulse_1.4s_ease-in-out_infinite]"
          />
          <span className="absolute -bottom-2 left-0 h-[2px] w-full bg-esprit-red/20 overflow-hidden">
            <span className="block h-full w-1/3 bg-esprit-red animate-[loading-bar_1.2s_ease-in-out_infinite]" />
          </span>
        </div>
        {message && <p className="text-sm text-esprit-black/60 font-medium">{message}</p>}
      </div>
    </div>
  );
}

/* Petit composant inline utilisable dans une zone de page (pas plein écran) */
export function LoadingInline({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-8 text-esprit-black/50 text-sm">
      <span className="w-4 h-4 border-2 border-esprit-red border-t-transparent rounded-full animate-spin" />
      {label}
    </div>
  );
}
