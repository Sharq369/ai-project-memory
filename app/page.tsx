import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* NAVBAR */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <span className="text-xl font-bold text-slate-900">Project<span className="text-blue-600">Memory</span></span>
        <Link href="/login" className="text-sm font-medium text-blue-600">Log In</Link>
      </nav>
      
      {/* HERO */}
      <header className="px-4 py-16 text-center bg-slate-50">
        <h1 className="text-4xl font-extrabold mb-4">Never lose AI Context.</h1>
        <p className="text-slate-600 mb-8">Store and manage project files for AI chat memory.</p>
        <Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold">Get Started</Link>
      </header>

      {/* PRICING TABLE */}
      <section className="py-16 px-4 max-w-5xl mx-auto grid gap-8 md:grid-cols-3">
        {['Free', 'Premium', 'Professional'].map((plan) => (
          <div key={plan} className="border border-slate-200 p-6 rounded-xl text-center">
            <h3 className="text-lg font-bold">{plan}</h3>
            <p className="text-2xl font-black my-4">{plan === 'Free' ? '$0' : plan === 'Premium' ? '$12' : '$49'}</p>
            <Link href="/login" className="block w-full py-2 bg-slate-900 text-white rounded-md text-sm">Select Plan</Link>
          </div>
        ))}
      </section>
    </div>
  );
}
