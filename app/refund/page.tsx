export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-400 p-8 md:p-24 font-sans leading-relaxed">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Refund Policy</h1>
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Digital Delivery & Final Sales</h2>
          <p>Due to the irreversible nature of cryptocurrency transactions and the immediate delivery of digital AI compute tokens, <strong>all sales are final</strong>. Access to the Neural Node premium tiers constitutes full delivery of our service.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Exceptions & Technical Failures</h2>
          <p>In the rare event of a verified systemic failure on our end where payment was confirmed on the blockchain but tokens were not allocated, we will manually credit your account. We do not issue refunds for network gas fees or user errors (e.g., sending funds on the wrong network).</p>
        </section>

        <footer className="pt-12 text-[10px] uppercase tracking-widest opacity-50">
          Neural Node • Immutable Transactions
        </footer>
      </div>
    </div>
  )
}
