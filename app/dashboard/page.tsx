'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function DashboardPage() {
  const [content, setContent] = useState('')
  const [tag, setTag] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Please enter some content')
      return
    }

    setIsSaving(true)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        alert('You must be logged in to save memories')
        setIsSaving(false)
        return
      }

      // Insert memory into database
      const { error: insertError } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          content: content.trim(),
          tag: tag.trim() || null,
        })

      if (insertError) {
        console.error('Error saving memory:', insertError)
        alert('Failed to save memory. Please try again.')
        setIsSaving(false)
        return
      }

      // Success
      alert('Memory saved successfully! ✅')
      setContent('')
      setTag('')
      setIsModalOpen(false)
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Add Memory Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Memory
        </button>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Save New Memory</h2>

              {/* Tag Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Tag (optional)
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g., work, personal, ideas..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving}
                />
              </div>

              {/* Content Textarea */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your memory here..."
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => {
                    setIsModalOpen(false)
                    setContent('')
                    setTag('')
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Memory'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
