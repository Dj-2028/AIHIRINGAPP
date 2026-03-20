import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Home, Briefcase, Settings, BarChart } from 'lucide-react';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, full_name, organizations(name)')
    .eq('id', user.id)
    .single();

  const role = userData?.role || 'candidate';
  const initial = user.email ? user.email.charAt(0).toUpperCase() : 'U';
  const emailTrunc = user.email ? (user.email.length > 20 ? user.email.substring(0, 18) + '...' : user.email) : '';

  return (
    <div className="flex h-screen bg-[#FAFAF9] text-[#1A1A18] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[56px] hover:w-[200px] transition-all duration-200 border-r border-[#E5E5E3] bg-[#F5F5F3] flex flex-col group relative z-50 shrink-0">
        <div className="flex h-[48px] items-center px-[19px] border-b border-[#E5E5E3] overflow-hidden shrink-0">
          <Link href="/dashboard" className="flex items-center">
            <span className="font-mono text-[14px] font-medium text-[#1A1A18]">SV</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 overflow-x-hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-4 px-[18px] h-[36px] text-[#1A1A18] border-l-2 border-[#1A1A18] bg-[#EFEFED] whitespace-nowrap"
          >
            <Home size={16} className="shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[13px] font-medium">Dashboard</span>
          </Link>

          {role === 'recruiter' && (
            <Link
              href="/jobs"
              className="flex items-center gap-4 px-[18px] h-[36px] text-[#6B7280] hover:text-[#1A1A18] border-l-2 border-transparent hover:border-[#1A1A18] hover:bg-[#EFEFED] transition-colors whitespace-nowrap"
            >
              <Briefcase size={16} className="shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[13px] font-medium">Jobs</span>
            </Link>
          )}

          {role === 'candidate' && (
            <Link
              href="/profile"
              className="flex items-center gap-4 px-[18px] h-[36px] text-[#6B7280] hover:text-[#1A1A18] border-l-2 border-transparent hover:border-[#1A1A18] hover:bg-[#EFEFED] transition-colors whitespace-nowrap"
            >
              <Settings size={16} className="shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[13px] font-medium">Profile</span>
            </Link>
          )}

          {role === 'admin' && (
            <>
              <div className="pt-6 pb-2 px-[18px] text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Admin
              </div>
              <Link
                href="/admin/org"
                className="flex items-center gap-4 px-[18px] h-[36px] text-[#6B7280] hover:text-[#1A1A18] border-l-2 border-transparent hover:border-[#1A1A18] hover:bg-[#EFEFED] transition-colors whitespace-nowrap"
              >
                <Settings size={16} className="shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[13px] font-medium">Organizations</span>
              </Link>
              <Link
                href="/admin/skill-graph"
                className="flex items-center gap-4 px-[18px] h-[36px] text-[#6B7280] hover:text-[#1A1A18] border-l-2 border-transparent hover:border-[#1A1A18] hover:bg-[#EFEFED] transition-colors whitespace-nowrap"
              >
                <BarChart size={16} className="shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[13px] font-medium">Skill Graph</span>
              </Link>
              <Link
                href="/admin/bias-log"
                className="flex items-center gap-4 px-[18px] h-[36px] text-[#6B7280] hover:text-[#1A1A18] border-l-2 border-transparent hover:border-[#1A1A18] hover:bg-[#EFEFED] transition-colors whitespace-nowrap"
              >
                <BarChart size={16} className="shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[13px] font-medium">Bias Log</span>
              </Link>
            </>
          )}

          <div className="mt-auto">
             <form action="/auth/signout" method="post">
                <button className="w-full flex items-center gap-4 px-[18px] h-[36px] text-[#6B7280] hover:text-[#1A1A18] border-l-2 border-transparent hover:border-[#1A1A18] hover:bg-[#EFEFED] transition-colors whitespace-nowrap">
                  <LogOut size={16} className="shrink-0" />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[13px] font-medium">Sign Out</span>
                </button>
             </form>
          </div>
        </nav>

        <div className="p-[12px] border-t border-[#E5E5E3] overflow-hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-[32px] h-[32px] rounded-full bg-[#E5E5E3] flex items-center justify-center text-[#1A1A18] font-mono text-[13px] shrink-0 border border-[#D1D5DB]">
              {initial}
            </div>
            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
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
        {children}
      </main>
    </div>
  );
}
