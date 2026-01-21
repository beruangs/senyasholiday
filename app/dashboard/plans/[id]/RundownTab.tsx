'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar as CalendarIcon, Edit2, X } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface Rundown {
  _id?: string
  date: string
  time: string
  activity: string
  location: string
  notes: string
}

export default function RundownTab({ planId }: { planId: string }) {
  const [rundowns, setRundowns] = useState<Rundown[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Rundown>({
    date: '',
    time: '',
    activity: '',
    location: '',
    notes: '',
  })

  useEffect(() => {
    fetchRundowns()
  }, [planId])

  const fetchRundowns = async () => {
    try {
      const res = await fetch(`/api/rundowns?planId=${planId}`)
      if (res.ok) {
        const data = await res.json()
        setRundowns(data)
      }
    } catch (error) {
      toast.error('Gagal memuat rundown')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        // Update existing rundown
        const res = await fetch('/api/rundowns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _id: editingId,
            holidayPlanId: planId,
            ...formData,
          }),
        })

        if (res.ok) {
          toast.success('Rundown berhasil diperbarui')
          setShowForm(false)
          setEditingId(null)
          setFormData({ date: '', time: '', activity: '', location: '', notes: '' })
          fetchRundowns()
        }
      } else {
        // Create new rundown
        const res = await fetch('/api/rundowns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            holidayPlanId: planId,
            ...formData,
          }),
        })

        if (res.ok) {
          toast.success('Rundown berhasil ditambahkan')
          setShowForm(false)
          setFormData({ date: '', time: '', activity: '', location: '', notes: '' })
          fetchRundowns()
        }
      }
    } catch (error) {
      toast.error(editingId ? 'Gagal memperbarui rundown' : 'Gagal menambahkan rundown')
    }
  }

  const startEdit = (rundown: Rundown) => {
    setEditingId(rundown._id || null)
    setFormData(rundown)
    setShowForm(true)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setShowForm(false)
    setFormData({ date: '', time: '', activity: '', location: '', notes: '' })
  }

  const deleteRundown = async (id: string) => {
    if (!confirm('Yakin ingin menghapus rundown ini?')) return

    try {
      const res = await fetch(`/api/rundowns?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Rundown berhasil dihapus')
        fetchRundowns()
      }
    } catch (error) {
      toast.error('Gagal menghapus rundown')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  // Group rundowns by date
  const groupedRundowns = rundowns.reduce((acc: any, rundown) => {
    const date = rundown.date
    if (!acc[date]) acc[date] = []
    acc[date].push(rundown)
    return acc
  }, {})

  // Sort rundowns within each date by time
  const sortedGroupedRundowns = Object.keys(groupedRundowns).reduce((acc: any, date) => {
    acc[date] = groupedRundowns[date].sort((a: Rundown, b: Rundown) => {
      // If both have time, sort by time
      if (a.time && b.time) {
        return a.time.localeCompare(b.time)
      }
      // If only one has time, put it first
      if (a.time) return -1
      if (b.time) return 1
      return 0
    })
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Rundown Acara</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Rundown</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? 'Edit Rundown' : 'Tambah Rundown Baru'}
            </h3>
            <button
              type="button"
              onClick={cancelEdit}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Waktu</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aktivitas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Contoh: Perjalanan menuju pantai"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Contoh: Pantai Parangtritis"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder="Catatan tambahan..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {editingId ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {rundowns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada rundown. Tambahkan jadwal acara sekarang!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(sortedGroupedRundowns)
            .sort()
            .map((date) => (
              <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-primary-50 px-6 py-3 border-b border-primary-100">
                  <h3 className="font-semibold text-primary-900">
                    {format(new Date(date), 'EEEE, d MMMM yyyy', { locale: id })}
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {sortedGroupedRundowns[date].map((rundown: Rundown) => (
                    <div key={rundown._id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {rundown.time && (
                            <span className="text-sm font-medium text-primary-600 mb-1 block">
                              {rundown.time}
                            </span>
                          )}
                          <h4 className="font-semibold text-gray-900 mb-2">{rundown.activity}</h4>
                          {rundown.location && (
                            <p className="text-sm text-gray-600 mb-1">📍 {rundown.location}</p>
                          )}
                          {rundown.notes && (
                            <p className="text-sm text-gray-600 mt-2">{rundown.notes}</p>
                          )}
                        </div>
                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={() => startEdit(rundown)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteRundown(rundown._id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Hapus"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
