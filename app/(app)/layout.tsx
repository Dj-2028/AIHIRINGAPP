import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClientLayout } from '@/components/layout/ClientLayout';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, email, full_name, organizations(name)')
    .eq('id', user.id)
    .single();

  return (
    <ClientLayout user={user} userData={userData}>
      {children}
    </ClientLayout>
  );
}

