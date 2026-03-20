import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VelocityScoreCard } from '@/components/candidate/VelocityScoreCard';
import { SkillTimelineBuilder } from '@/components/candidate/SkillTimelineBuilder';

export default async function ProfilePage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get candidate info
  const { data: candidateInfo } = await supabase
    .from('candidates')
    .select('id, user_id, users(full_name)')
    .eq('user_id', user.id)
    .single();

  if (!candidateInfo) {
    redirect('/dashboard');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12 bg-[#FAFAF9]">
      <div className="border-b border-[#E5E5E3] pb-6">
        <h1 className="text-2xl font-medium tracking-tight text-[#1A1A18]">Your Profile</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">Manage your skill timeline and view your velocity score.</p>
      </div>

      <VelocityScoreCard candidate={candidateInfo as any} />

      <div className="bg-white border border-[#E5E5E3] p-8 mt-8">
        <SkillTimelineBuilder candidateId={candidateInfo.id} entries={[]} />
      </div>
    </div>
  );
}
