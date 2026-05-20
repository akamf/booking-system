import { Suspense } from 'react';
import { SignInForm } from '@/features/auth/sign-in-form';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Sportshallen Admin</h1>
        <p className="text-sm text-neutral-500 mb-6">Sign in with your email.</p>
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}
