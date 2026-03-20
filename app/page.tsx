import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button-variants';

export default async function LandingPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A18] font-sans">
      
      {/* Navbar */}
      <nav className="h-[52px] bg-[#FAFAF9] border-b border-[#E5E5E3] w-full sticky top-0 z-50">
        <div className="max-w-[1080px] mx-auto px-6 md:px-[48px] h-full flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <span className="font-mono text-[13px] font-semibold text-[#1A1A18]">SV</span>
            <span className="text-[14px] font-medium text-[#1A1A18]">SkillVelocity</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-[13px] text-[#6B7280]">
              Log in
            </Link>
            <Link href="/signup" className={buttonVariants({ size: 'sm', className: 'uppercase tracking-[0.06em] rounded-[2px]' })}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-[1080px] mx-auto px-6 md:px-[48px]">
        
        {/* Hero Section */}
        <div className="pt-16 md:pt-[96px] pb-12 md:pb-[80px] grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-[64px] items-start">
          
          {/* Left Hero Text */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-[#9CA3AF] mb-[16px]">
              HIRING INTELLIGENCE · LEARNING TRAJECTORY
            </div>
            <h1 className="text-4xl md:text-[56px] font-medium leading-[1.15] text-[#1A1A18]">
              Hire for <span className="text-[#D97706]">velocity.</span><br className="hidden md:block" />
              Not just inventory.
            </h1>
            <p className="text-[17px] font-normal text-[#6B7280] max-w-[480px] leading-[1.7] mt-[24px]">
              Most hiring tools ask what a candidate knows today.<br />
              SkillVelocity asks how fast they'll know what you need tomorrow.
            </p>
            <div className="mt-[32px] flex items-center gap-[12px]">
              <Link href="/signup" className={buttonVariants({ className: 'rounded-[2px]' })}>
                Start Hiring
              </Link>
              <Link href="/signup" className={buttonVariants({ variant: 'outline', className: 'rounded-[2px]' })}>
                I'm a Candidate
              </Link>
            </div>
          </div>

          {/* Right Hero Mockup */}
          <div className="border border-[#E5E5E3] rounded-[4px] p-4 md:p-[20px] bg-[#FFFFFF] mt-2 hidden sm:block">
            <div className="flex justify-between items-center mb-[24px]">
              <div className="text-[11px] font-mono text-[#6B7280] uppercase">TOP CANDIDATES — Rust Developer</div>
              <div className="text-[11px] font-mono text-[#9CA3AF]">[Run Ranking]</div>
            </div>
            
            <div className="flex flex-col">
              {/* Row 1 */}
              <div className="flex h-[52px] border-l-[2px] border-[#D97706] pl-[12px] -ml-[14px]">
                <div className="w-[32px] font-mono text-[13px] text-[#1A1A18] mt-0.5">#1</div>
                <div className="w-[100px] text-[13px] text-[#1A1A18] font-medium mt-0.5">Sarah K.</div>
                <div className="w-[32px] font-mono text-[13px] text-[#1A1A18] mt-0.5">91</div>
                <div className="w-[100px] font-mono text-[13px] text-[#9CA3AF] tracking-[0.2em] mt-0.5">··············█</div>
                <div className="ml-auto flex flex-col items-end">
                  <span className="font-mono text-[11px] text-[#1A1A18]">Δ1 · passed</span>
                  <span className="text-[11px] text-[#6B7280] mt-[2px]">No Rust — but C++ + fast learner</span>
                  <span className="text-[11px] text-[#6B7280] mt-[1px]">Est. productive in 2.5 weeks ↗</span>
                </div>
              </div>
              <div className="border-t border-[#F3F3F1] my-[8px]" />
              
              {/* Row 2 */}
              <div className="flex h-[52px]">
                <div className="w-[32px] font-mono text-[13px] text-[#6B7280] mt-0.5">#2</div>
                <div className="w-[100px] text-[13px] text-[#1A1A18] mt-0.5">James M.</div>
                <div className="w-[32px] font-mono text-[13px] text-[#6B7280] mt-0.5">84</div>
                <div className="w-[100px] font-mono text-[13px] text-[#E5E5E3] tracking-[0.2em] mt-0.5">············█</div>
                <div className="ml-auto flex flex-col items-end">
                  <span className="font-mono text-[11px] text-[#6B7280]">Δ0 · passed</span>
                  <span className="text-[11px] text-[#9CA3AF] mt-[2px]">Has Rust · slow velocity</span>
                </div>
              </div>
              <div className="border-t border-[#F3F3F1] my-[8px]" />
              
              {/* Row 3 */}
              <div className="flex h-[52px]">
                <div className="w-[32px] font-mono text-[13px] text-[#6B7280] mt-0.5">#3</div>
                <div className="w-[100px] text-[13px] text-[#1A1A18] mt-0.5">Priya R.</div>
                <div className="w-[32px] font-mono text-[13px] text-[#6B7280] mt-0.5">79</div>
                <div className="w-[100px] font-mono text-[13px] text-[#E5E5E3] tracking-[0.2em] mt-0.5">···········█</div>
                <div className="ml-auto flex flex-col items-end">
                  <span className="font-mono text-[11px] text-[#6B7280]">Δ2 · passed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Strip */}
        <div className="mt-12 md:mt-[80px] border-t border-[#E5E5E3] pt-12 md:pt-[48px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-[48px]">
            <div>
              <div className="text-[11px] uppercase text-[#9CA3AF] mb-[8px]">SIGNAL 01</div>
              <h3 className="text-[16px] font-medium text-[#1A1A18] mb-[8px]">Learning Velocity Score</h3>
              <p className="text-[14px] text-[#6B7280] max-w-[280px] leading-[1.7]">
                We calculate how many skills a candidate acquires per year and rank them against the full cohort. Speed is a signal. We surface it.
              </p>
            </div>
            <div>
              <div className="text-[11px] uppercase text-[#9CA3AF] mb-[8px]">SIGNAL 02</div>
              <h3 className="text-[16px] font-medium text-[#1A1A18] mb-[8px]">Skill Adjacency Graph</h3>
              <p className="text-[14px] text-[#6B7280] max-w-[280px] leading-[1.7]">
                500+ skills mapped by structural similarity. C++ is 87% similar to Rust. We know that. Your keyword filter doesn't.
              </p>
            </div>
            <div>
              <div className="text-[11px] uppercase text-[#9CA3AF] mb-[8px]">SIGNAL 03</div>
              <h3 className="text-[16px] font-medium text-[#1A1A18] mb-[8px]">Glass-Box Ranking</h3>
              <p className="text-[14px] text-[#6B7280] max-w-[280px] leading-[1.7]">
                Every score comes with a full reasoning chain. Time-to-productivity estimate. Shadow bias check. No black boxes.
              </p>
            </div>
          </div>
        </div>

        {/* One Stat Section */}
        <div className="mt-12 md:mt-[80px] border-y border-[#E5E5E3] py-12 md:py-[48px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#E5E5E3]">
            <div className="pl-0 pr-0 md:pr-[48px] pb-8 md:pb-0">
              <div className="text-5xl md:text-[48px] font-mono font-medium text-[#1A1A18] leading-none">0.6×</div>
              <div className="text-[12px] text-[#9CA3AF] mt-[6px]">velocity weight</div>
            </div>
            <div className="pl-0 md:pl-[48px] pr-0 md:pr-[48px] py-8 md:py-0">
              <div className="text-5xl md:text-[48px] font-mono font-medium text-[#1A1A18] leading-none">91%</div>
              <div className="text-[12px] text-[#9CA3AF] mt-[6px]">bias check pass rate</div>
            </div>
            <div className="pl-0 md:pl-[48px] pr-0 pt-8 md:pt-0">
              <div className="text-5xl md:text-[48px] font-mono font-medium text-[#1A1A18] leading-none">2.5 wks</div>
              <div className="text-[12px] text-[#9CA3AF] mt-[6px]">avg time-to-productivity</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-[32px] mt-[80px]">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-[#9CA3AF]">SV · SkillVelocity</div>
            <div className="text-[12px] text-[#9CA3AF]">Built at hackathon · 2025</div>
          </div>
        </footer>

      </main>
    </div>
  );
}
