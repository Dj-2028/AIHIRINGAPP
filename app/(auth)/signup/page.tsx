'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        let targetPath = '/dashboard';

        if (role === 'recruiter' && orgName) {
          const newOrgId = crypto.randomUUID();
          
          // Create organization
          const { error: orgError } = await supabase
            .from('organizations')
            .insert({ id: newOrgId, name: orgName });

          if (orgError) throw orgError;

          // Update user - The trigger has already created the users row
          // We don't need a timeout if we use a small retry or just wait for trigger success implicitly
          // For now, even a small 500ms is safer than 1000ms if we must, 
          // but better to actually check or use a server-side action.
          // However, keeping it simple for current architecture.
          const { error: updateError } = await supabase
            .from('users')
            .update({ org_id: newOrgId })
            .eq('id', authData.user.id);

          if (updateError) throw updateError;
        } else if (role === 'candidate') {
          // Candidate row is now handled by the database trigger handle_new_user()
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
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-medium tracking-tight">Create account</CardTitle>
          <CardDescription>SkillVelocity / High-Signal Hiring</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSignup}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>I am a...</Label>
                <Tabs value={role} onValueChange={(v) => setRole(v as 'recruiter' | 'candidate')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="candidate">Candidate</TabsTrigger>
                    <TabsTrigger value="recruiter">Recruiter</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {role === 'recruiter' && (
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="text-[13px] text-destructive bg-destructive/10 p-3 rounded-md font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingSpinner /> : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-[13px] text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-foreground font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
