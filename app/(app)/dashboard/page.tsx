import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { VelocityScoreCard } from '@/components/candidate/VelocityScoreCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
      <div className="flex flex-col h-full bg-background">
        {/* Top bar */}
        <div className="h-14 bg-background border-b flex items-center justify-between px-4 md:px-8 shrink-0">
          <h1 className="text-base font-medium">Dashboard</h1>
        </div>

        {/* Content area */}
        <div className="p-4 md:p-8 w-full max-w-5xl">
          <VelocityScoreCard candidate={{ id: candidateInfo.id, user_id: candidateInfo.user_id, velocity_score: candidateInfo.velocity_score } as any} />

          <div className="mt-8">
            <h2 className="text-xs tracking-widest text-muted-foreground uppercase font-normal mb-4">Recent Applications</h2>
            <Card className="flex flex-col items-center justify-center py-16 shadow-none">
              <p className="text-sm text-muted-foreground mb-4">No applications yet.</p>
              <Link href="/jobs" className={buttonVariants({ variant: 'outline' })}>Browse open roles →</Link>
            </Card>
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
      <div className="flex flex-col h-full bg-background">
        {/* Top bar */}
        <div className="h-14 bg-background border-b flex items-center justify-between px-4 md:px-8 shrink-0">
          <h1 className="text-base font-medium">Dashboard</h1>
          <Link href="/jobs/new" className={buttonVariants({ size: 'sm' })}>Post New Job</Link>
        </div>

        {/* Content area */}
        <div className="p-8 w-full max-w-5xl mx-0">
          
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase font-normal">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-mono font-medium leading-none">{jobsCount || 0}</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase font-normal">Total Applicants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-mono font-medium leading-none">{appsCount}</div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase font-normal">Avg Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-mono font-medium text-muted-foreground leading-none">—</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent jobs section */}
          <div className="mt-8">
            <h2 className="text-xs tracking-widest text-muted-foreground uppercase font-normal mb-4">Recent Jobs</h2>
            
            {(!recentJobs || recentJobs.length === 0) ? (
              <Card className="flex flex-col items-center justify-center py-16 shadow-none">
                <p className="text-sm text-muted-foreground mb-4">No jobs posted yet.</p>
                <Link href="/jobs/new" className={buttonVariants({ variant: 'outline' })}>Post your first job →</Link>
              </Card>
            ) : (
              <div className="rounded-md border bg-card overflow-x-auto">
                <Table className="min-w-[600px] md:min-w-full">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead>Applicants</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">{job.title}</div>
                          <div className="text-xs text-muted-foreground">{job.seniority_level}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                           <span className="font-mono text-sm text-foreground">
                            {job.applications[0]?.count || 0}
                           </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/jobs/${job.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>View Leaderboard</Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
