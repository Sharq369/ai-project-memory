'use client';

export default function Settings() {
  const plans = [
    { name: 'Free', price: '$0', feat: ['3 Projects', '8k Tokens'] },
    { name: 'Premium', price: '$12', feat: ['Unlimited', '32k Tokens'], hot: true },
    { name: 'Pro', price: '$49', feat: ['Team Sync', '100k Tokens'] }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-slate-500 mb-8 text-sm">Manage your account and subscription plans.</p>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className={`p-6 rounded-xl border bg-white ${plan.hot ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
            <h3 className="font-bold">{plan.name}</h3>
            <p className="text-2xl font-black my-2">{plan.price}<span className="text-sm font-normal text-slate-400">/mo</span></p>
            <ul className="text-sm text-slate-600 space-y-2 mb-6">
              {plan.feat.map(f => <li key={f}>✓ {f}</li>)}
            </ul>
            <button className={`w-full py-2 rounded-lg text-sm font-bold ${plan.hot ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {plan.name === 'Free' ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-10 p-6 bg-red-50 rounded-xl border border-red-100">
        <h3 className="text-red-700 font-bold text-sm">Danger Zone</h3>
        <button className="mt-2 text-xs text-red-600 underline">Delete Account</button>
      </div>
    </div>
  );
}
