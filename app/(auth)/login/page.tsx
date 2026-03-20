'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const supabase = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          router.push('/dashboard');
          router.refresh();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAFAF9]">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-[#1A1A18]">
            Sign in
          </h2>
          <p className="mt-2 text-[13px] text-[#6B7280]">
            SkillVelocity / High-Signal Hiring
          </p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#1A1A18',
                  brandAccent: '#000000',
                  inputText: '#1A1A18',
                  inputBackground: '#FFFFFF',
                  inputBorder: '#E5E5E3',
                  inputLabelText: '#1A1A18',
                  messageText: '#D97706',
                  dividerBackground: '#E5E5E3'
                },
                space: {
                  labelBottomMargin: '4px',
                  inputPadding: '8px 12px',
                },
                radii: {
                  borderRadiusButton: '0px',
                  buttonBorderRadius: '0px',
                  inputBorderRadius: '0px'
                }
              }
            },
            className: {
              container: 'text-[#1A1A18] font-sans',
              divider: 'bg-[#E5E5E3]',
              input: 'bg-white border-[#E5E5E3] text-[#1A1A18] placeholder-[#6B7280] focus:ring-1 focus:ring-[#1A1A18] focus:border-[#1A1A18] shadow-none !rounded-none',
              label: 'text-[#1A1A18] text-[13px] font-medium',
              button: 'btn w-full mt-2',
              anchor: 'text-[#6B7280] hover:text-[#1A1A18] text-[13px]'
            }
          }}
          providers={[]}
        />
      </div>
    </div>
  );
}
