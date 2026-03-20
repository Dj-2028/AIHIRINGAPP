import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminSkillGraphPage() {
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

  const { data: items } = await supabase
    .from('skill_adjacency')
    .select(`
      id,
      similarity_score,
      skill1:skills!skill_adjacency_skill1_id_fkey(name),
      skill2:skills!skill_adjacency_skill2_id_fkey(name)
    `)
    .order('similarity_score', { ascending: false })
    .limit(100);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Skill Adjacency Graph</h1>
        <p className="text-gray-400">View similarity scores between required and acquired skills.</p>
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm">
          Interactive D3 force-directed graph visualization is deferred post-hackathon. Showing tabular data.
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Skill 1</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Skill 2</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Similarity Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items?.map((item: any) => (
              <tr key={item.id} className="hover:bg-white/5">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{item.skill1.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{item.skill2.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center gap-3">
                     <span className="text-sm font-medium text-white">{item.similarity_score.toFixed(3)}</span>
                     <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-blue-500 rounded-full" 
                         style={{ width: `${item.similarity_score * 100}%` }}
                       />
                     </div>
                   </div>
                </td>
              </tr>
            ))}
            {(!items || items.length === 0) && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-400">
                  No skill adjacencies found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
