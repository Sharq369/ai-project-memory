'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Database, Plus, Loader2, Trash2, 
  Image as ImageIcon, X, Folder, Hash, Calendar 
} from 'lucide-react'

export default function MemoriesPage() {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState('none')
  const [projects, setProjects] = useState<any[]>([])
  const [memories, setMemories] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [mRes, pRes] = await Promise.all([
      supabase.from('memories').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('name')
    ])
    if (mRes.data) setMemories(mRes.data)
    if (pRes.data) setProjects(pRes.data)
    setLoading(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSaving) return
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      let uploadedImageUrl = null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('memory-images')
          .upload(fileName, imageFile)
        
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('memory-images').getPublicUrl(fileName)
        uploadedImageUrl = publicUrl
      }

      const { data, error } = await supabase
        .from('memories')
        .insert([{ 
          content, 
          user_id: user?.id,
          project_id: selectedProject === 'none' ? null : selectedProject,
          image_url: uploadedImageUrl,
          tag: 'OBSERVATION' 
        }])
        .select()

      if (!error && data) {
        setMemories([data[0], ...memories])
        setContent(''); setImageFile(null); setPreviewUrl(null)
      }
    } catch (err: any) { alert(err.message) }
    finally { setIsSaving(false) }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <section className="bg-[#16181e] border border-gray-800 rounded-3xl p-6 shadow-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <textarea
            className="w-full bg-[#0f1117] border border-gray-800 rounded-2xl p-5 text-gray-200 outline-none focus:border-blue-500/50 min-h-[120px] resize-none"
            placeholder="Capture a thought..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {previewUrl && (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-700">
              <img src={previewUrl} className="w-full h-full object-cover" />
              <button onClick={() => {setPreviewUrl(null); setImageFile(null)}} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white"><X size={12} /></button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <label className="cursor-pointer bg-[#0f1117] p-3 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                <ImageIcon size={18} className="text-gray-400" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
              </label>
              <select 
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-[#0f1117] text-xs text-gray-400 px-4 rounded-xl border border-gray-800 outline-none"
              >
                <option value="none">No Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button disabled={isSaving} className="bg-blue-600 px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2">
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} SAVE
            </button>
          </div>
        </form>
      </section>

      <div className="grid gap-4">
        {memories.map((m) => (
          <div key={m.id} className="bg-[#16181e] border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex gap-2 items-center text-[10px] font-bold text-gray-500 uppercase">
                <Hash size={12} /> {m.tag} <Calendar size={12} className="ml-2" /> {new Date(m.created_at).toLocaleDateString()}
              </div>
              <p className="text-gray-300">{m.content}</p>
            </div>
            {m.image_url && (
              <img src={m.image_url} className="w-full md:w-32 h-32 object-cover rounded-xl border border-gray-800 shadow-lg" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
