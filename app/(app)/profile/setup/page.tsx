'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { SkillTimelineBuilder } from '@/components/candidate/SkillTimelineBuilder';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Get candidate id
      const { data } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setCandidateId(data.id);
      }
      setIsLoading(false);
    }
    init();
  }, [router, supabase]);

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      if (candidateId) {
        // Trigger velocity score recalculation
        await fetch('/api/candidates/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId }),
        });
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Failed to complete setup:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Build Your Skill Timeline</h1>
        <p className="text-gray-400">
          Add the core skills you've learned. Be accurate with dates — SkillVelocity values *how fast* you learn, not just what you know.
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
        <SkillTimelineBuilder candidateId={candidateId as string} entries={[]} />
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleComplete}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? <LoadingSpinner /> : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
}
