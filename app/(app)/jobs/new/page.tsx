'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { JDParser } from '@/components/jobs/JDParser';
import { useAppStore } from '@/store/useAppStore';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
          description: '', 
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
    <div className="p-8 max-w-5xl mx-auto space-y-8 bg-background">
      <div className="border-b pb-6">
        <h1 className="text-2xl font-medium tracking-tight mb-1">Post a New Job</h1>
        <p className="text-sm text-muted-foreground">
          Paste your job description and let Gemini AI extract the required skills automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase font-normal">1. Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form id="job-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Seniority Level</Label>
                  <select
                    value={seniority}
                    onChange={(e) => setSeniority(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <JDParser />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/20 bg-destructive/10 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t mt-8">
        <Button
          type="submit"
          form="job-form"
          disabled={isSubmitting || parsedSkills.length === 0}
          className="flex items-center gap-2"
        >
          {isSubmitting ? <LoadingSpinner /> : 'Post Job & Start Ranking'}
        </Button>
      </div>
    </div>
  );
}
