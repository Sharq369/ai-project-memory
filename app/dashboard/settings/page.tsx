'use client'

import { Check, Crown, Zap, ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    price: '$0',
    features: ['3 Project Limit', 'Basic AI Sync', 'Standard Support'],
    current: true
  },
  {
    name: 'Premium',
    price: '$19',
    features: ['Unlimited Projects', 'Deep Repo Analysis', 'Priority Queue', 'Custom Tags'],
    current: false
  },
  {
    name: 'Platinum',
    price: '$49',
    features: ['Full Team Access', 'Private LLM Nodes', '24/7 Concierge', 'API Access'],
    current: false
  }
]

export default function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Subscription & Plans</h1>
        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">Manage your neural memory capacity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative bg-[#16181e] border ${plan.current ? 'border-blue-500' : 'border-gray-800'} rounded-[2.5rem] p-8 flex flex-col shadow-2xl`}>
            {plan.current && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-400">
                Current Plan
              </span>
            )}
            
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">/mo</span>
              </div>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                  <Check size={14} className="text-blue-500" /> {feature}
                </li>
              ))}
            </ul>

            <Link 
              href={plan.current ? '#' : `/dashboard/checkout/${plan.name.toLowerCase()}`}
              className={`w-full py-4 rounded-2xl font-black text-[10px] text-center uppercase tracking-[0.2em] transition-all ${
                plan.current 
                ? 'bg-gray-800 text-gray-500 cursor-default' 
                : 'bg-white text-black hover:bg-blue-600 hover:text-white shadow-xl shadow-blue-900/10'
              }`}
            >
              {plan.current ? 'Active' : 'Upgrade Plan'}
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-[#16181e] border border-gray-800 rounded-[2rem] p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><ShieldCheck size={24} /></div>
          <div>
            <h4 className="text-white font-bold text-sm">Enterprise Security</h4>
            <p className="text-gray-500 text-xs">All payments processed through encrypted Stripe channels.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
