"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileCode2, GraduationCap, History } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: "easeOut" },
  }),
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-esprit-offwhite">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <Image
          src="/esprit-logo.png"
          alt="ESPRIT — Se former autrement"
          width={190}
          height={100}
          priority
          className="h-24 w-auto"
        />
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-esprit-black hover:text-esprit-red transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 text-sm font-medium text-white bg-esprit-red cut-corner-sm hover:bg-esprit-red-dark transition-colors"
          >
            S'inscrire
          </Link>
        </nav>
      </header>

      {/* Hero — séquence d'entrée orchestrée */}
      <section className="px-6 md:px-12 pt-10 pb-24 grid md:grid-cols-2 gap-14 items-center max-w-7xl mx-auto">
        <div>
          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="font-display font-semibold text-4xl md:text-5xl leading-[1.08] text-esprit-black"
          >
            Corrigez votre code avant que quelqu'un d'autre ne le fasse.
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="mt-6 text-lg text-esprit-black/70 max-w-md leading-relaxed"
          >
            La plateforme ESPRIT qui analyse votre code — qualité, conformité
            à l'énoncé, bonnes pratiques — et vous rend un feedback détaillé,
            en quelques secondes.
          </motion.p>
          <motion.div
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-esprit-red text-white font-medium cut-corner hover:bg-esprit-red-dark hover:-translate-y-0.5 transition-all"
            >
              Commencer
              <ArrowRight size={18} />
            </Link>
            <a
              href="#comment-ca-marche"
              className="px-6 py-3 font-medium text-esprit-black border border-esprit-black/20 hover:border-esprit-black transition-colors"
            >
              Voir comment ça marche
            </a>
          </motion.div>
        </div>

        {/* Démo visuelle : extrait de code annoté */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
          className="relative"
        >
          <div className="bg-esprit-charcoal cut-corner p-6 font-mono text-sm text-esprit-gray-light shadow-2xl">
            <div className="flex gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-esprit-red" />
              <span className="w-2.5 h-2.5 rounded-full bg-esprit-gray" />
              <span className="w-2.5 h-2.5 rounded-full bg-esprit-gray/50" />
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed">
<span className="text-esprit-gray">public class</span> Solution {"{"}
  <span className="text-esprit-gray">public int</span> f(<span className="text-esprit-gray">int</span> x) {"{"}
    <span className="text-esprit-gray">int</span> r = 1;
    <span className="text-esprit-gray">for</span>(int i=1;i{"<="}x;i++) r=r*i;
    <span className="text-esprit-gray">return</span> r;
  {"}"}
{"}"}
            </pre>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="absolute -bottom-8 -left-6 bg-white cut-corner-sm shadow-xl p-4 max-w-[240px] border-l-4 border-esprit-red"
          >
            <p className="text-sm text-esprit-black/80 leading-snug">
              Renomme <code className="text-esprit-red">f</code> et{" "}
              <code className="text-esprit-red">x</code> — utilise des noms
              explicites comme <code className="text-esprit-red">factorielle</code>.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1.1, ease: "backOut" }}
            className="absolute -top-6 -right-6 bg-esprit-red text-white cut-corner-sm w-20 h-20 flex flex-col items-center justify-center shadow-xl"
          >
            <span className="font-display font-bold text-2xl leading-none">13</span>
            <span className="text-[11px] opacity-90">/ 20</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="px-6 md:px-12 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="font-display font-semibold text-3xl text-esprit-black max-w-lg"
          >
            Comment ça marche
          </motion.h2>
          <div className="mt-12 grid md:grid-cols-3 gap-10">
            {[
              {
                title: "Soumettez votre code",
                text: "Collez ou importez votre fichier, quel que soit le langage — Python, Java, JS, PHP, C#, et plus.",
              },
              {
                title: "L'analyse tourne",
                text: "Analyse statique du code, recherche de critères pédagogiques pertinents, puis génération du feedback.",
              },
              {
                title: "Recevez votre feedback",
                text: "Points forts, points faibles, suggestions concrètes avec exemples de code, et une note si vous êtes en mode examen.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div
                  className="mt-1 flex-shrink-0 w-0 h-0"
                  style={{
                    borderTop: "8px solid transparent",
                    borderBottom: "8px solid transparent",
                    borderLeft: "12px solid #E2001A",
                  }}
                />
                <div>
                  <h3 className="font-display font-semibold text-lg text-esprit-black">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-esprit-black/65 leading-relaxed">
                    {step.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Deux modes */}
      <section className="px-6 md:px-12 py-20 max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="font-display font-semibold text-3xl text-esprit-black max-w-lg"
        >
          Deux façons de vous entraîner
        </motion.h2>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45 }}
            whileHover={{ y: -4 }}
            className="cut-corner bg-esprit-charcoal text-white p-8 transition-shadow hover:shadow-xl"
          >
            <FileCode2 className="text-esprit-red" size={28} />
            <h3 className="mt-4 font-display font-semibold text-xl">
              Code Review
            </h3>
            <p className="mt-3 text-white/70 leading-relaxed">
              Entraînez-vous librement. Vous recevez un feedback détaillé sans
              note — l'occasion de progresser sans pression.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="cut-corner bg-esprit-red text-white p-8 transition-shadow hover:shadow-xl"
          >
            <GraduationCap size={28} />
            <h3 className="mt-4 font-display font-semibold text-xl">
              Mode Examen
            </h3>
            <p className="mt-3 text-white/85 leading-relaxed">
              Même analyse rigoureuse, avec une note sur 20 justifiée —
              pour vous évaluer dans les conditions réelles.
            </p>
          </motion.div>
        </div>
        <div className="mt-6 flex items-center gap-3 text-esprit-black/60">
          <History size={20} />
          <p>
            Chaque soumission est enregistrée. Retrouvez votre historique et
            comparez vos progrès d'une tentative à l'autre.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-10 bg-esprit-charcoal text-white/60 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} ESPRIT — Se former autrement</span>
          <span>Code Evaluator</span>
        </div>
      </footer>
    </main>
  );
}
