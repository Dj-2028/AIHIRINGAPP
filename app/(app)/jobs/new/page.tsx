'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { JDParser } from '@/components/jobs/JDParser';
import { useAppStore } from '@/store/useAppStore';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function NewJobPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const parsedSkills = useAppStore(state => state.parsedSkills);
  
  const [title, setTitle] = useState('');
  const [seniority, setSeniority] = useState('Mid-Level');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();
          
        if (data?.organization_id) {
          setOrgId(data.organization_id);
        }
      }
    }
    getOrg();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          organization_id: orgId,
          description: '', // JDParser text is just for parsing currently. We could store it too.
          seniority_level: seniority,
          parsedSkills
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create job');
      }

      const { job } = await res.json();
      router.push(`/jobs/${job.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 bg-[#FAFAF9]">
      <div className="border-b border-[#E5E5E3] pb-6">
        <h1 className="text-2xl font-medium tracking-tight text-[#1A1A18] mb-1">Post a New Job</h1>
        <p className="text-[13px] text-[#6B7280]">
          Paste your job description and let Gemini AI extract the required skills automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E3] p-6">
            <h2 className="text-[13px] font-medium tracking-tight text-[#1A1A18] mb-4 uppercase">1. Job Details</h2>
            <form id="job-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1A1A18] mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-[13px] text-[#1A1A18] focus:border-[#1A1A18] focus:outline-none transition-colors"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>
              
              <div>
                <label className="block text-[13px] font-medium text-[#1A1A18] mb-1">
                  Seniority Level
                </label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-[13px] text-[#1A1A18] focus:border-[#1A1A18] focus:outline-none transition-colors"
                >
                  <option value="Entry-Level">Entry-Level</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Principal">Principal</option>
                </select>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <JDParser />
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-[13px] text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-[#E5E5E3]">
        <button
          type="submit"
          form="job-form"
          disabled={isSubmitting || parsedSkills.length === 0}
          className="btn flex items-center gap-2"
        >
          {isSubmitting ? <LoadingSpinner /> : 'Post Job & Start Ranking'}
        </button>
      </div>
    </div>
  );
}
