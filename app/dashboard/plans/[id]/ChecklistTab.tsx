'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle2, Circle, Loader2, Sparkles, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'

interface ChecklistItem {
    _id: string
    category: string
    item: string
    isCompleted: boolean
}

export default function ChecklistTab({
    planId,
    planTitle = '',
    destination = ''
}: {
    planId: string
    planTitle?: string
    destination?: string
}) {
    const [items, setItems] = useState<ChecklistItem[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [newItem, setNewItem] = useState('')

    useEffect(() => {
        fetchChecklist()
    }, [planId])

    const fetchChecklist = async () => {
        try {
            const res = await fetch(`/api/plans/${planId}/checklist`)
            if (res.ok) {
                const data = await res.json()
                setItems(data)
            }
        } catch (error) {
            toast.error('Gagal memuat checklist')
        } finally {
            setLoading(false)
        }
    }

    const addItem = async (itemText: string) => {
        if (!itemText.trim()) return

        setAdding(true)
        try {
            const res = await fetch(`/api/plans/${planId}/checklist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item: itemText.trim(),
                    category: 'packing'
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setNewItem('')
                fetchChecklist()
                toast.success('Berhasil ditambahkan')
            } else {
                // SHOW DETAILED ERROR
                const msg = data.details || data.error || 'Gagal menyimpan'
                toast.error(`Error: ${msg}`)
                console.error('Checklist Error:', data)
            }
        } catch (error) {
            toast.error('Terjadi kesalahan koneksi')
        } finally {
            setAdding(false)
        }
    }

    const toggleItem = async (itemId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/plans/${planId}/checklist`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: itemId,
                    isCompleted: !currentStatus
                }),
            })

            if (res.ok) {
                setItems(items.map(it => it._id === itemId ? { ...it, isCompleted: !currentStatus } : it))
            }
        } catch (error) {
            toast.error('Gagal memperbarui status')
        }
    }

    const deleteItem = async (itemId: string) => {
        try {
            const res = await fetch(`/api/plans/${planId}/checklist?id=${itemId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                setItems(items.filter(it => it._id !== itemId))
            }
        } catch (error) {
            toast.error('Gagal menghapus')
        }
    }

    // Recommendation logic
    const getSmartRecommendations = () => {
        const text = (planTitle + ' ' + destination).toLowerCase()
        const recs = [{ item: 'Paspor' }, { item: 'Tiket' }, { item: 'Charger' }]
        if (text.includes('haji') || text.includes('umrah')) {
            recs.push({ item: 'Kain Ihram' }, { item: 'Buku Doa' })
        }
        return recs.filter(rec => !items.some(it => it.item.toLowerCase() === rec.item.toLowerCase()))
    }

    const smartRecs = getSmartRecommendations()

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
    )

    const completedCount = items.filter(it => it.isCompleted).length
    const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Progress */}
            {items.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-700">Persiapan: {completedCount}/{items.length}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* Suggestions */}
            {smartRecs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-400 w-full mb-1">Cepat:</span>
                    {smartRecs.map((rec, i) => (
                        <button
                            key={i}
                            onClick={() => addItem(rec.item)}
                            className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs hover:border-primary-400 hover:text-primary-600 transition-all"
                        >
                            + {rec.item}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem(newItem)}
                    placeholder="Tambah barang atau persiapan..."
                    className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                />
                <button
                    onClick={() => addItem(newItem)}
                    disabled={adding || !newItem.trim()}
                    className="p-3.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 shadow-md"
                >
                    {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {items.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Belum ada daftar.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {items.map((item) => (
                            <div key={item._id} className="group flex items-center gap-4 p-4 hover:bg-gray-50">
                                <button
                                    onClick={() => toggleItem(item._id, item.isCompleted)}
                                    className={`transition-all ${item.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-primary-500'}`}
                                >
                                    {item.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                </button>
                                <span className={`flex-1 font-semibold ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                    {item.item}
                                </span>
                                <button onClick={() => deleteItem(item._id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
