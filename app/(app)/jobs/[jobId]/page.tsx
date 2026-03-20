import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { SkillChip } from '@/components/jobs/SkillChip';
import { JobWithApplications } from '@/types';

export default async function JobLeaderboardPage({ params }: { params: { jobId: string } }) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'recruiter') {
    redirect('/dashboard');
  }

  // Fetch job details
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', params.jobId)
    .single();

  if (error || !job) {
    return <div>Job not found</div>;
  }

  if (job.organization_id !== userData.organization_id) {
    return <div>Unauthorized</div>;
  }

  // Fetch applications
  const { data: applications } = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/jobs/${params.jobId}/leaderboard`,
    {
      headers: {
        Cookie: require('next/headers').cookies().toString(),
      },
      next: { tags: [`job-${params.jobId}`] }
    }
  ).then(res => res.json()).catch(() => ({ data: [] }));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 bg-[#FAFAF9]">
      <div className="flex justify-between items-end border-b border-[#E5E5E3] pb-6">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-[#1A1A18] mb-1">{job.title}</h1>
          <div className="flex items-center gap-2 text-[13px] text-[#6B7280]">
            <span>{job.seniority_level}</span>
            <span>·</span>
            <span className="font-mono">{new Date(job.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        <form action={`/api/applications/rank`} method="POST">
          <input type="hidden" name="jobId" value={job.id} />
          <button
            type="submit"
            className="btn py-2 px-4 shadow-sm"
          >
            Run AI Ranking
          </button>
        </form>
      </div>

      <div className="border border-[#E5E5E3] bg-[#FAFAF9] p-6 max-w-3xl">
        <h2 className="text-[13px] font-medium text-[#1A1A18] uppercase tracking-wider mb-4 border-b border-[#E5E5E3] pb-2">
          Required Skills
        </h2>
        <div className="flex flex-wrap gap-2">
          {(job.parsed_skills as { required: string[], nice_to_have: string[] })?.required?.map((skill, i) => (
            <SkillChip key={i} name={skill} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-[13px] font-medium tracking-tight text-[#1A1A18] mb-2 uppercase">Candidates Pipeline</h2>
        <LeaderboardTable 
          entries={applications || []} 
        />
      </div>
    </div>
  );
}
