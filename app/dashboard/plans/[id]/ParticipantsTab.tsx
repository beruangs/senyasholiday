'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Users as UsersIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  _id?: string
  name: string
}

export default function ParticipantsTab({ planId }: { planId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    fetchParticipants()
  }, [planId])

  const fetchParticipants = async () => {
    try {
      const res = await fetch(`/api/participants?planId=${planId}`)
      if (res.ok) {
        const data = await res.json()
        setParticipants(data)
      }
    } catch (error) {
      toast.error('Gagal memuat data peserta')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holidayPlanId: planId,
          name,
          order: participants.length,
        }),
      })

      if (res.ok) {
        toast.success('Peserta berhasil ditambahkan')
        setShowForm(false)
        setName('')
        fetchParticipants()
      }
    } catch (error) {
      toast.error('Gagal menambahkan peserta')
    }
  }

  const deleteParticipant = async (id: string) => {
    if (!confirm('Yakin ingin menghapus peserta ini?')) return

    try {
      const res = await fetch(`/api/participants?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Peserta berhasil dihapus')
        fetchParticipants()
      }
    } catch (error) {
      toast.error('Gagal menghapus peserta')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Daftar Peserta</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Peserta</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Peserta <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Contoh: Zeva"
            />
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      {participants.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada peserta. Tambahkan peserta sekarang!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {participants.map((participant, index) => (
            <div
              key={participant._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{participant.name}</span>
                </div>
                <button
                  onClick={() => deleteParticipant(participant._id!)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Tips:</strong> Tambahkan semua peserta terlebih dahulu sebelum mengelola iuran dan split payment.
        </p>
      </div>
    </div>
  )
}
