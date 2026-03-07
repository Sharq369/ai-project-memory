export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-400 p-8 md:p-24 font-sans leading-relaxed">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Privacy Policy</h1>
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">1. Data Collection</h2>
          <p>We collect minimal data required to provide our service, including your email address and GitHub metadata if linked. We do not sell your personal data to third parties.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">2. Payment Security</h2>
          <p>All payments are processed securely via Paddle. We never store your credit card information on our servers.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">3. AI Training</h2>
          <p>Your private code is never used to train global AI models without your explicit, opt-in consent.</p>
        </section>

        <footer className="pt-12 text-[10px] uppercase tracking-widest opacity-50">
          Neural Capacity • Privacy Standards
        </footer>
      </div>
    </div>
  )
}
