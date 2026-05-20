import Link from 'next/link';

export default function NoAccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
        <h1 className="text-lg font-semibold text-neutral-900 mb-2">Access required</h1>
        <p className="text-sm text-neutral-600 mb-4">
          Your account is signed in, but it doesn&apos;t have admin or staff access.
          Ask a site admin to add the role to your profile.
        </p>
        <Link href="/sign-in" className="text-sm text-brand-600 hover:underline">
          Sign in with a different account
        </Link>
      </div>
    </main>
  );
}
