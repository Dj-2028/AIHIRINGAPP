import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { VelocityScoreCard } from '@/components/candidate/VelocityScoreCard';

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single();

  const role = userData?.role || user.user_metadata?.role || 'candidate';

  if (role === 'candidate') {
    // Check if profile is setup
    const { data: candidateInfo } = await supabase
      .from('candidates')
      .select('*, skill_entries(*)')
      .eq('user_id', user.id)
      .single();

    if (!candidateInfo) {
      redirect('/profile/setup');
    }

    return (
      <div className="flex flex-col h-full bg-[#FAFAF9]">
        {/* Top bar */}
        <div className="h-[48px] bg-[#FAFAF9] border-b border-[#E5E5E3] flex items-center justify-between px-8 shrink-0">
          <h1 className="text-[16px] font-medium text-[#1A1A18]">Dashboard</h1>
        </div>

        {/* Content area */}
        <div className="p-[32px] w-full max-w-[960px] mx-0">
          <VelocityScoreCard candidate={{ id: candidateInfo.id, user_id: candidateInfo.user_id, velocity_score: candidateInfo.velocity_score } as any} />

          <div className="mt-[32px]">
            <h2 className="text-[11px] uppercase tracking-[0.08em] text-[#9CA3AF] font-normal mb-[16px]">Recent Applications</h2>
            <div className="flex flex-col items-center justify-center py-[64px]">
              <p className="text-[14px] text-[#6B7280] mb-[8px]">No applications yet.</p>
              <Link href="/jobs" className="text-[13px] text-[#1A1A18] hover:underline">
                Browse open roles →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'recruiter') {
    // Fetch stats
    const { count: jobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', userData?.org_id);

    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('org_id', userData?.org_id);

    const jobIds = jobs?.map(j => j.id) || [];
    
    let appsCount = 0;
    if (jobIds.length > 0) {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds);
      appsCount = count || 0;
    }

    const { data: recentJobs } = await supabase
      .from('jobs')
      .select('*, applications(count)')
      .eq('org_id', userData?.org_id)
      .order('created_at', { ascending: false })
      .limit(5);

    return (
      <div className="flex flex-col h-full bg-[#FAFAF9]">
        {/* Top bar */}
        <div className="h-[48px] bg-[#FAFAF9] border-b border-[#E5E5E3] flex items-center justify-between px-8 shrink-0">
          <h1 className="text-[16px] font-medium text-[#1A1A18]">Dashboard</h1>
          <Link
            href="/jobs/new"
            className="h-[32px] px-[12px] bg-[#1A1A18] text-white text-[12px] rounded-[2px] flex items-center justify-center hover:bg-black transition-colors"
          >
            Post New Job
          </Link>
        </div>

        {/* Content area */}
        <div className="p-[32px] w-full max-w-[960px] mx-0">
          
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-[16px] mt-[24px]">
            <div className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[4px] p-[24px]">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#9CA3AF] font-normal">Active Jobs</div>
              <div className="mt-[8px] text-[40px] font-mono font-medium text-[#1A1A18] leading-none">{jobsCount || 0}</div>
            </div>
            
            <div className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[4px] p-[24px]">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#9CA3AF] font-normal">Total Applicants</div>
              <div className="mt-[8px] text-[40px] font-mono font-medium text-[#1A1A18] leading-none">{appsCount}</div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[4px] p-[24px]">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#9CA3AF] font-normal">Avg Velocity</div>
              <div className="mt-[8px] text-[40px] font-mono font-medium text-[#1A1A18] leading-none">—</div>
            </div>
          </div>

          {/* Recent jobs section */}
          <div className="mt-[32px]">
            <h2 className="text-[11px] uppercase tracking-[0.08em] text-[#9CA3AF] font-normal mb-[16px]">Recent Jobs</h2>
            
            {(!recentJobs || recentJobs.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-[64px]">
                <p className="text-[14px] text-[#6B7280] mb-[8px]">No jobs posted yet.</p>
                <Link href="/jobs/new" className="text-[13px] text-[#1A1A18] hover:underline">
                  Post your first job →
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-[#E5E5E3]">
                <table className="min-w-full divide-y divide-[#E5E5E3]">
                  <thead className="bg-[#FAFAF9]">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
                        Posted
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
                        Applicants
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E3] bg-white">
                    {recentJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-[#F5F5F3] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[13px] font-medium text-[#1A1A18]">{job.title}</div>
                          <div className="text-[13px] text-[#6B7280]">{job.seniority_level}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[13px] text-[#6B7280] font-mono">
                          {new Date(job.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className="text-[13px] font-mono text-[#1A1A18]">
                            {job.applications[0]?.count || 0}
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-[13px] font-medium">
                          <Link href={`/jobs/${job.id}`} className="text-[#1A1A18] hover:underline">
                            View Leaderboard
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin fallback or unrecognized role
  return <div>Welcome Admin</div>;
}
