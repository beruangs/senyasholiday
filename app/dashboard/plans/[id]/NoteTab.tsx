'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Edit2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import 'react-quill/dist/quill.snow.css'

// Dynamic import React Quill untuk avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

export default function NoteTab({ planId }: { planId: string }) {
  const [note, setNote] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchNote()
  }, [planId])

  const fetchNote = async () => {
    try {
      const res = await fetch(`/api/notes?planId=${planId}`)
      if (res.ok) {
        const data = await res.json()
        setNote(data.content || '')
      }
    } catch (error) {
      toast.error('Gagal memuat note')
    } finally {
      setLoading(false)
    }
  }

  const saveNote = async () => {
    try {
      setIsSaving(true)
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          content: note,
        }),
      })

      if (res.ok) {
        toast.success('Note berhasil disimpan')
        setIsEditing(false)
      } else {
        toast.error('Gagal menyimpan note')
      }
    } catch (error) {
      toast.error('Gagal menyimpan note')
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEdit = () => {
    fetchNote()
    setIsEditing(false)
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Catatan Plan</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Edit2 className="w-5 h-5" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <ReactQuill
              value={note}
              onChange={setNote}
              theme="snow"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  ['blockquote', 'code-block'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  [{ color: [] }, { background: [] }],
                  ['clean'],
                ],
              }}
              placeholder="Tulis catatan untuk plan ini..."
              className="h-96"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={cancelEdit}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
              <span>Batal</span>
            </button>
            <button
              onClick={saveNote}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {note ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: note }}
            />
          ) : (
            <p className="text-gray-500 italic">Belum ada catatan. Klik tombol "Edit" untuk mulai menulis.</p>
          )}
        </div>
      )}
    </div>
  )
}
