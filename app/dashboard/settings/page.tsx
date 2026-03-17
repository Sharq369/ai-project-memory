'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Download, Loader2, Settings, Palette, Database, ShieldAlert, Cpu } from 'lucide-react'

export default function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Fetch all projects for this user
      const { data: projects, error: projError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
      
      if (projError) throw projError

      // Fetch all code memories
      const { data: memories, error: memError } = await supabase
        .from('code_memories')
        .select('*')
      
      if (memError) throw memError

      // Link memories to their respective projects in the JSON
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: user.email,
        workspace: projects?.map(p => ({
          ...p,
          files: memories?.filter(m => m.project_id === p.id) || []
        }))
      }

      // Create downloadable JSON file
      const dataStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neural_node_backup_${new Date().getTime()}.json`
      a.click()
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export data. Check console for details.")
    } finally {
      setIsExporting(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'neural', label: 'Neural Capacity', icon: Cpu },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert },
  ]

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="text-blue-500" size={28} />
            <h1 className="text-3xl font-bold tracking-tight italic uppercase">System Preferences</h1>
          </div>
          <p className="text-gray-500 text-sm">Manage your integrations, billing, and global workspace parameters.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* SIDEBAR TABS */}
          <div className="w-full md:w-64 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-[#0F172A] text-blue-400 border border-[#1E293B]' 
                      : 'text-gray-500 hover:bg-[#111] hover:text-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 space-y-6">
            
            {activeTab === 'general' && (
              <>
                {/* WORKSPACE PREFERENCES */}
                <div className="p-6 md:p-8 rounded-2xl border border-gray-800 bg-[#0A0A0A] shadow-lg">
                  <h2 className="text-lg font-bold mb-1">Workspace Preferences</h2>
                  <p className="text-sm text-gray-500 mb-6">Customize how your app looks and behaves.</p>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-[#111]">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-200">Application Theme</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Currently locked to "Stealth Vibe" (Dark Mode).</p>
                    </div>
                    <span className="px-3 py-1 bg-[#0F172A] border border-[#1E293B] text-blue-500 text-[10px] font-bold tracking-wider rounded-full uppercase">
                      Dark Only
                    </span>
                  </div>
                </div>

                {/* DATA EXPORT */}
                <div className="p-6 md:p-8 rounded-2xl border border-gray-800 bg-[#0A0A0A] shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Database size={18} className="text-gray-400" />
                    <h2 className="text-lg font-bold">Data Export</h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">Download a copy of all your code memories and neural nodes as a JSON file.</p>
                  
                  <button 
                    onClick={handleExportData} 
                    disabled={isExporting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#111] border border-gray-700 hover:border-blue-500 hover:bg-[#0F172A] text-gray-300 hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <Download size={16} />}
                    {isExporting ? 'Packing Memory Bundle...' : 'Export JSON Bundle'}
                  </button>
                </div>
              </>
            )}

            {/* PLACEHOLDER FOR OTHER TABS */}
            {activeTab !== 'general' && (
              <div className="p-12 text-center border border-gray-800 border-dashed rounded-2xl bg-[#0A0A0A]">
                <p className="text-gray-500 text-sm">This module is currently offline.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
