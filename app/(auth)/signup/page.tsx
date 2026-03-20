'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'recruiter' | 'candidate'>('candidate');
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Wait briefly to ensure the database trigger creates the users row
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let targetPath = '/dashboard';

        if (role === 'recruiter' && orgName) {
          const newOrgId = crypto.randomUUID();
          
          // Create organization (no .select() to avoid read RLS violation)
          const { error: orgError } = await supabase
            .from('organizations')
            .insert({ id: newOrgId, name: orgName });

          if (orgError) throw orgError;

          // Update user with correct column 'org_id'
          const { error: updateError } = await supabase
            .from('users')
            .update({ org_id: newOrgId })
            .eq('id', authData.user.id);

          if (updateError) throw updateError;
        } else if (role === 'candidate') {
          // Create candidate profile
          const { error: candidateError } = await supabase
            .from('candidates')
            .insert({ user_id: authData.user.id });

          if (candidateError) throw candidateError;
          targetPath = '/profile/setup';
        }

        router.push(targetPath);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAFAF9]">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-[#1A1A18]">
            Create account
          </h2>
          <p className="mt-2 text-[13px] text-[#6B7280]">
            SkillVelocity / High-Signal Hiring
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1A18]">I am a...</label>
              <div className="mt-2 flex gap-0 border border-[#E5E5E3]">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`flex-1 py-2 text-[13px] font-medium transition-colors ${
                    role === 'candidate'
                      ? 'bg-[#1A1A18] text-[#FAFAF9]'
                      : 'bg-transparent text-[#6B7280] hover:bg-[#F5F5F3]'
                  }`}
                >
                  Candidate
                </button>
                <div className="w-[1px] bg-[#E5E5E3]" />
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`flex-1 py-2 text-[13px] font-medium transition-colors ${
                    role === 'recruiter'
                      ? 'bg-[#1A1A18] text-[#FAFAF9]'
                      : 'bg-transparent text-[#6B7280] hover:bg-[#F5F5F3]'
                  }`}
                >
                  Recruiter
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-[13px] font-medium text-[#1A1A18]">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-none border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-[#1A1A18] placeholder-[#6B7280] focus:border-[#1A1A18] focus:outline-none focus:ring-1 focus:ring-[#1A1A18] sm:text-[13px]"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-[#1A1A18]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-none border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-[#1A1A18] placeholder-[#6B7280] focus:border-[#1A1A18] focus:outline-none focus:ring-1 focus:ring-[#1A1A18] sm:text-[13px]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-[#1A1A18]">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-none border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-[#1A1A18] placeholder-[#6B7280] focus:border-[#1A1A18] focus:outline-none focus:ring-1 focus:ring-[#1A1A18] sm:text-[13px]"
              />
            </div>

            {role === 'recruiter' && (
              <div>
                <label htmlFor="orgName" className="block text-[13px] font-medium text-[#1A1A18]">
                  Organization Name
                </label>
                <input
                  id="orgName"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="mt-1 block w-full rounded-none border border-[#E5E5E3] bg-[#FAFAF9] px-3 py-2 text-[#1A1A18] placeholder-[#6B7280] focus:border-[#1A1A18] focus:outline-none focus:ring-1 focus:ring-[#1A1A18] sm:text-[13px]"
                  placeholder="Acme Corp"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-[13px] text-[#D97706] bg-[#FAFAF9] p-3 border border-[#E5E5E3]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <LoadingSpinner /> : 'Sign Up'}
          </button>

          <p className="text-left text-[13px] text-[#6B7280]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-[#1A1A18] hover:underline"
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
