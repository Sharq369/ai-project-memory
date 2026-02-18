'use client'

import { Check, Crown, Zap } from 'lucide-react'
import Link from 'next/link'

const plans = [
  { name: 'Free', price: '$0', features: ['3 Project Limit', 'Basic AI Sync'], current: true },
  { name: 'Premium', price: '$19', features: ['Unlimited Projects', 'Deep Analysis'], current: false, highlight: true },
  { name: 'Platinum', price: '$49', features: ['Team Access', 'API Access'], current: false }
]

export default function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12">
      <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Neural Capacity</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.name} className={`bg-[#16181e] border ${plan.highlight ? 'border-blue-500' : 'border-gray-800'} rounded-[2.5rem] p-8 flex flex-col`}>
            <h3 className="text-xl font-bold text-white mb-4">{plan.name}</h3>
            <div className="mb-8"><span className="text-4xl font-black text-white">{plan.price}</span><span className="text-gray-500 text-[10px] uppercase ml-2">/mo</span></div>
            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map(f => <li key={f} className="flex items-center gap-3 text-xs text-gray-400"><Check size={14} className="text-blue-500" /> {f}</li>)}
            </ul>
            <Link href={plan.current ? '#' : `/dashboard/checkout/${plan.name.toLowerCase()}`} className={`w-full py-4 rounded-2xl font-black text-[10px] text-center uppercase tracking-widest ${plan.current ? 'bg-gray-800 text-gray-500' : 'bg-white text-black hover:bg-blue-600 hover:text-white'}`}>
              {plan.current ? 'Active' : 'Select Plan'}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
