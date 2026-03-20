import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminOrgPage() {
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

  const { data: orgs } = await supabase.from('organizations').select('*');
  const { data: users } = await supabase.from('users').select('*, organizations(name)');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Organizations & Users</h1>
        <p className="text-gray-400">Manage all registered users and platforms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-4">Organizations ({orgs?.length || 0})</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {orgs?.map((org) => (
                  <tr key={org.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 blur-[2px] hover:blur-none transition-all">{org.id.split('-')[0]}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{org.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
           <h2 className="text-xl font-bold tracking-tight text-white mb-4">Users ({users?.length || 0})</h2>
           <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Org</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users?.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{u.full_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-red-500/10 text-red-400' :
                        u.role === 'recruiter' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                         {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{u.organizations?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
