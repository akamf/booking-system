export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-4xl font-semibold text-neutral-900">Sportshallen</h1>
        <p className="text-neutral-600">
          The public booking site is under construction. In the meantime, use
          the mobile app or contact the venue directly.
        </p>
        <p className="text-sm text-neutral-400">
          Staff: <a href="http://localhost:3001" className="text-brand-600 hover:underline">admin →</a>
        </p>
      </div>
    </main>
  );
}
