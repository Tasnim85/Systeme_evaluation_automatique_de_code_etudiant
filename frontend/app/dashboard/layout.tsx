"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  FileCode2,
  GraduationCap,
  History,
  User,
  LogOut,
  LayoutGrid,
  BookPlus,
} from "lucide-react";
import { clearToken, getToken, api } from "@/lib/api";

const studentNav = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutGrid },
  { href: "/dashboard/review", label: "Code Review", icon: FileCode2 },
  { href: "/dashboard/exam", label: "Mode Examen", icon: GraduationCap },
  { href: "/dashboard/history", label: "Historique", icon: History },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

const teacherNav = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutGrid },
  { href: "/dashboard/teacher/exercises", label: "Mes exercices", icon: BookPlus },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<"etudiant" | "enseignant" | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api.me().then((u) => setRole(u.role)).catch(() => router.replace("/login"));
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  const navItems = role === "enseignant" ? teacherNav : studentNav;

  return (
    <div className="min-h-screen bg-esprit-offwhite flex">
      <aside className="w-60 bg-esprit-charcoal text-white flex flex-col flex-shrink-0 min-h-screen">
        <div className="p-5">
          <Image
            src="/esprit-logo.png"
            alt="ESPRIT"
            width={190}
            height={100}
            className="h-20 w-auto brightness-0 invert"
          />
        </div>
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-esprit-red -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 m-3 text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </aside>

      <div className="flex-1 min-h-screen">{children}</div>
    </div>
  );
}
