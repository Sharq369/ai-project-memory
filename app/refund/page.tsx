export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-400 p-8 md:p-24 font-sans leading-relaxed">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Refund Policy</h1>
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Standard Policy</h2>
          <p>We offer a 14-day money-back guarantee if you have not used more than 10% of your AI token allocation for the month. Since our products are digital assets, access to the "Neural Capacity" premium features constitutes delivery of service.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">How to Request</h2>
          <p>All refund requests must be directed to our Merchant of Record, Paddle, at <strong>help@paddle.com</strong>. Please include your order number and the email used for purchase.</p>
        </section>

        <footer className="pt-12 text-[10px] uppercase tracking-widest opacity-50">
          Neural Capacity • Customer Satisfaction
        </footer>
      </div>
    </div>
  )
}
