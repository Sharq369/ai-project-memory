import Link from 'next/link';

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-16 md:w-64 bg-white border-r border-slate-200 p-4 flex flex-col">
        <div className="mb-8 font-bold text-blue-600">PM</div>
        <nav className="space-y-4">
          <Link href="/dashboard" className="block text-slate-600">📂</Link>
          <Link href="/dashboard/settings" className="block text-slate-600">⚙️</Link>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
