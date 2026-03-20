import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminBiasLogPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin') redirect('/dashboard');

  const { data: apps } = await supabase
    .from('applications')
    .select(`
      id,
      bias_check,
      candidates(users(full_name)),
      jobs(title, organizations(name))
    `)
    .not('bias_check', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Bias Check Audit Log</h1>
          <p className="text-gray-400">Review AI ranking fairness validations across all platforms.</p>
        </div>
        <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors">
          Export CSV
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Application</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Scores</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Removed Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {apps?.map((app: any) => {
              const check = app.bias_check as any;
              if (!check) return null;
              
              const isPass = check.passed;
              
              return (
                <tr key={app.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                    {app.candidates?.users?.full_name || 'Anonymous'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{app.jobs?.title}</div>
                    <div className="text-xs text-gray-500">{app.jobs?.organizations?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isPass ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {isPass ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      Standard: <span className="text-white font-medium">{check.standard_score}</span>
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      Anonymized: <span className="text-white font-medium">{check.anonymized_score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {check.fields_removed?.map((field: string, i: number) => (
                         <span key={i} className="px-2 py-0.5 bg-white/5 text-gray-400 rounded text-xs">
                           {field}
                         </span>
                      ))}
                      {(!check.fields_removed || check.fields_removed.length === 0) && (
                        <span className="text-xs text-gray-500">None</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!apps || apps.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  No bias checks recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
