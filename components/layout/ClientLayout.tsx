"use client";
import { useState } from "react";
import Link from 'next/link';
import { LogOut, Home, Briefcase, Settings, BarChart, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function ClientLayout({
  children,
  user,
  userData
}: {
  children: React.ReactNode;
  user: any;
  userData: any;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = userData?.role || 'candidate';
  const initial = user.email ? user.email.charAt(0).toUpperCase() : 'U';
  const emailTrunc = user.email ? (user.email.length > 20 ? user.email.substring(0, 18) + '...' : user.email) : '';

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home, show: true },
    { href: "/jobs", label: "Jobs", icon: Briefcase, show: role === 'recruiter' },
    { href: "/profile", label: "Profile", icon: Settings, show: role === 'candidate' },
    { href: "/admin/org", label: "Organizations", icon: Settings, show: role === 'admin' },
    { href: "/admin/skill-graph", label: "Skill Graph", icon: BarChart, show: role === 'admin' },
    { href: "/admin/bias-log", label: "Bias Log", icon: BarChart, show: role === 'admin' },
  ];

  return (
    <div className="flex h-screen bg-[#FAFAF9] text-[#1A1A18] overflow-hidden relative">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[240px] bg-[#F5F5F3] border-r border-[#E5E5E3] transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:w-[60px] lg:hover:w-[210px]
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
       group`}>
        <div className="flex h-[52px] items-center px-5 border-b border-[#E5E5E3] overflow-hidden shrink-0">
          <Link href="/dashboard" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
            <span className="font-mono text-[14px] font-medium text-[#1A1A18]">SV</span>
            <span className="ml-4 font-medium text-[14px] lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">SkillVelocity</span>
          </Link>
          <button className="ml-auto lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-x-hidden">
          {navItems.filter(i => i.show).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-4 px-5 h-10 text-[#6B7280] hover:text-[#1A1A18] hover:bg-[#EFEFED] border-l-2 border-transparent hover:border-[#1A1A18] transition-colors whitespace-nowrap"
            >
              <item.icon size={16} className="shrink-0" />
              <span className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 text-[13px] font-medium">{item.label}</span>
            </Link>
          ))}

          <div className="mt-auto">
            <form action="/auth/signout" method="post">
              <button className="w-full flex items-center gap-4 px-5 h-10 text-[#6B7280] hover:text-[#1A1A18] border-l-2 border-transparent hover:border-[#1A1A18] hover:bg-[#EFEFED] transition-colors whitespace-nowrap">
                <LogOut size={16} className="shrink-0" />
                <span className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 text-[13px] font-medium">Sign Out</span>
              </button>
            </form>
          </div>
        </nav>

        <div className="px-4 py-3 border-t border-[#E5E5E3] overflow-hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E5E5E3] flex items-center justify-center text-[#1A1A18] font-mono text-[13px] shrink-0 border border-[#D1D5DB]">
              {initial}
            </div>
            <div className="flex flex-col lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              <span className="text-[13px] text-[#1A1A18]">
                {emailTrunc}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mt-0.5">
                {role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#FAFAF9] overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden h-[52px] bg-[#FAFAF9] border-b border-[#E5E5E3] flex items-center px-5 shrink-0 sticky top-0 z-30">
          <button onClick={() => setMobileMenuOpen(true)} className="p-1 -ml-1">
            <Menu size={20} />
          </button>
          <span className="ml-4 font-mono text-[14px] font-medium">SkillVelocity</span>
        </div>

        {children}
      </main>
    </div>
  );
}
