import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SkillChip } from '@/components/jobs/SkillChip';
import Link from 'next/link';

export default async function ApplyPage({ params }: { params: { jobId: string } }) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'candidate') {
    redirect('/dashboard');
  }

  // Get candidate ID
  const { data: candidateInfo } = await supabase
    .from('candidates')
    .select('id, velocity_score')
    .eq('user_id', user.id)
    .single();

  if (!candidateInfo) {
    redirect('/profile/setup');
  }

  // Check if already applied
  const { data: existingApp } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', params.jobId)
    .eq('candidate_id', candidateInfo.id)
    .single();

  // Fetch Job Info
  const { data: job } = await supabase
    .from('jobs')
    .select('*, organizations(name)')
    .eq('id', params.jobId)
    .single();

  if (!job) {
    return <div>Job not found</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 bg-[#FAFAF9]">
      {existingApp && (
        <div className="bg-white border border-[#E5E5E3] text-[#1A1A18] px-4 py-3 flex flex-col gap-1 items-start text-sm">
          <span className="font-bold text-[13px]">✓ Application submitted</span>
          <span className="text-[13px] text-[#6B7280]">Wait for the recruiter to review the pipeline.</span>
        </div>
      )}

      <div className="bg-white border border-[#E5E5E3] p-8">
        <div className="border-b border-[#E5E5E3] pb-6 mb-6">
          <h1 className="text-2xl font-medium tracking-tight text-[#1A1A18] mb-1">
            {job.title}
          </h1>
          <p className="text-[#6B7280] text-[13px]">
            {job.organizations?.name} · {job.seniority_level}
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-[13px] font-medium text-[#1A1A18] border-b border-[#E5E5E3] pb-2 mb-4 uppercase tracking-wider">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {(job.parsed_skills as { required: string[] })?.required?.map((skill, i) => (
                <SkillChip key={i} name={skill} />
              ))}
            </div>
          </div>

          <div className="border border-[#E5E5E3] p-6 bg-[#FAFAF9]">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-[#1A1A18] font-medium text-[13px] mb-1">Your Velocity Score</h4>
                <p className="text-[13px] text-[#6B7280]">
                  This score is weighted with adjacency when ranking your application.
                </p>
              </div>
              <div className="text-[32px] font-mono font-medium text-[#D97706]">
                {candidateInfo.velocity_score || 0}
              </div>
            </div>
          </div>

          {!existingApp && (
             <form action="/api/applications" method="POST">
             <input type="hidden" name="jobId" value={job.id} />
             <input type="hidden" name="candidateId" value={candidateInfo.id} />
             
             <button
               type="submit"
               className="btn w-full mt-4 flex items-center justify-center py-4 text-[13px]"
             >
               Submit Application
             </button>
           </form>
          )}

          {existingApp && (
             <Link
               href="/dashboard"
               className="w-full flex items-center justify-center py-3 bg-[#FAFAF9] hover:bg-[#F5F5F3] border border-[#E5E5E3] text-[#1A1A18] text-[13px] font-medium transition-colors mt-8"
             >
               Return to Dashboard
             </Link>
          )}
        </div>
      </div>
    </div>
  );
}
