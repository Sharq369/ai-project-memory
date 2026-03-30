export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-400 p-8 md:p-24 font-sans leading-relaxed">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Privacy Policy</h1>
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">1. Data Collection</h2>
          <p>We collect minimal data required to provide our service, including your email address, connected wallet addresses, and GitHub metadata. We do not sell your personal data to third parties.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">2. Blockchain & Payments</h2>
          <p>Payments are processed via cryptocurrency networks. While we do not collect traditional banking or credit card information, please be aware that blockchain transactions and wallet addresses are public by nature. We are not responsible for privacy implications arising from the public ledger.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">3. AI Training</h2>
          <p>Your private repository code is never used to train global AI models without your explicit, opt-in consent. Code memories are siloed entirely to your specific node.</p>
        </section>

        <footer className="pt-12 text-[10px] uppercase tracking-widest opacity-50">
          Neural Node • Privacy Standards
        </footer>
      </div>
    </div>
  )
}
