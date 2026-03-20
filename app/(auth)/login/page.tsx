'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-medium tracking-tight">Sign in</CardTitle>
          <CardDescription>SkillVelocity / High-Signal Hiring</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--foreground))',
                    brandAccent: 'hsl(var(--foreground))',
                    inputText: 'hsl(var(--foreground))',
                    inputBackground: 'transparent',
                    inputBorder: 'hsl(var(--border))',
                    inputLabelText: 'hsl(var(--foreground))',
                    messageText: 'hsl(var(--destructive))',
                    dividerBackground: 'hsl(var(--border))'
                  },
                  space: {
                    labelBottomMargin: '8px',
                    inputPadding: '8px 12px',
                    buttonPadding: '8px 16px',
                  },
                  radii: {
                    borderRadiusButton: 'calc(var(--radius) - 2px)',
                    buttonBorderRadius: 'calc(var(--radius) - 2px)',
                    inputBorderRadius: 'calc(var(--radius) - 2px)'
                  }
                }
              },
              className: {
                container: 'font-sans',
                divider: 'bg-border',
                input: 'bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring shadow-sm',
                label: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                button: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 mt-2',
                anchor: 'text-sm text-muted-foreground hover:text-foreground'
              }
            }}
            providers={[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
