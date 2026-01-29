'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Plus, Trash2, FileText, Upload, Download, ExternalLink,
    X, Loader2, Sparkles, Plane, Hotel, Car, Shield, Info,
    Eye, MoreVertical, FileArchive, ImageIcon, File
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'
import { useSession } from 'next-auth/react'

interface TravelDocument {
    _id?: string
    name: string
    category: 'flight' | 'hotel' | 'transport' | 'visa' | 'insurance' | 'other'
    fileUrl?: string
    fileType: 'pdf' | 'image' | 'text'
    notes?: string
    rundownId?: string
    createdAt?: string
}

export default function TravelDocumentTab({ planId, isCompleted, userRole }: { planId: string; isCompleted?: boolean; userRole?: string }) {
    const { language, t } = useLanguage()
    const { data: session } = useSession()
    const [documents, setDocuments] = useState<TravelDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [formData, setFormData] = useState<Partial<TravelDocument>>({
        name: '',
        category: 'other',
        fileType: 'text',
        notes: '',
    })

    const isPremium = (session?.user as any)?.isPremium || userRole === 'superadmin'
    const formRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchDocuments()
    }, [planId])

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`/api/plans/${planId}/documents`)
            if (res.ok) {
                const data = await res.json()
                setDocuments(data)
            }
        } catch (error) {
            toast.error('Failed to load documents')
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!isPremium) {
            toast.error('Fitur Premium', { description: 'Hanya akun Premium yang bisa mengupload file PDF/Gambar ke Vault.' })
            return
        }

        setIsUploading(true)
        const reader = new FileReader()
        reader.onloadend = async () => {
            const result = reader.result as string

            try {
                // Upload to Vercel Blob via our API
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        file: result,
                        folder: 'receipts', // Using receipts folder for Vercel Blob as requested
                        filename: file.name
                    }),
                })

                if (!uploadRes.ok) throw new Error('Upload failed')
                const { url } = await uploadRes.json()

                let type: 'pdf' | 'image' | 'text' = 'text'
                if (file.type === 'application/pdf') type = 'pdf'
                else if (file.type.startsWith('image/')) type = 'image'

                setFormData({
                    ...formData,
                    fileUrl: url,
                    fileType: type,
                    name: formData.name || file.name.split('.')[0]
                })
            } catch (error) {
                toast.error('Gagal mengupload file')
            } finally {
                setIsUploading(false)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name) return

        try {
            const res = await fetch(`/api/plans/${planId}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (res.ok) {
                toast.success('Document added to Vault')
                setShowForm(false)
                setFormData({ name: '', category: 'other', fileType: 'text', notes: '' })
                fetchDocuments()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Failed to save')
            }
        } catch (error) {
            toast.error('Internal error')
        }
    }

    const deleteDocument = async (docId: string) => {
        if (!confirm('Hapus dokumen ini dari Vault?')) return
        try {
            const res = await fetch(`/api/plans/${planId}/documents/${docId}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Document removed')
                fetchDocuments()
            }
        } catch (error) {
            toast.error('Failed to delete')
        }
    }

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'flight': return <Plane className="w-5 h-5" />
            case 'hotel': return <Hotel className="w-5 h-5" />
            case 'transport': return <Car className="w-5 h-5" />
            case 'insurance': return <Shield className="w-5 h-5" />
            case 'visa': return <FileText className="w-5 h-5" />
            default: return <FileArchive className="w-5 h-5" />
        }
    }

    const getFileTypeIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-4 h-4 text-rose-500" />
            case 'image': return <ImageIcon className="w-4 h-4 text-blue-500" />
            default: return <File className="w-4 h-4 text-gray-400" />
        }
    }

    if (loading) return <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary-200 mx-auto" /></div>

    return (
        <div className="space-y-10 font-bold">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 px-8 py-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary-500/20 transition-all duration-700" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-900/20">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Document Vault</h2>
                    </div>
                    <p className="text-[9px] font-black text-primary-400/60 uppercase tracking-[0.4em] leading-none">Safe spot for your travel passes & tickets</p>
                </div>
                {!isCompleted && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="relative z-10 flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl hover:bg-primary-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95"
                    >
                        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{showForm ? (language === 'id' ? 'BATAL' : 'CANCEL') : (language === 'id' ? 'TAMBAH DOKUMEN' : 'ADD DOCUMENT')}</span>
                    </button>
                )}
            </div>

            {/* Document Form */}
            {showForm && (
                <div ref={formRef} className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <Shield className="w-32 h-32" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8">Add New Document</h3>
                    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-primary-500 transition-all font-black uppercase text-sm"
                                    placeholder="e.g. Flight Ticket to Japan"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                                <select
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-primary-500 transition-all font-black uppercase text-sm appearance-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                >
                                    <option value="flight">Flight</option>
                                    <option value="hotel">Hotel</option>
                                    <option value="transport">Transport</option>
                                    <option value="visa">Visa</option>
                                    <option value="insurance">Insurance</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document File (PDF/Image)</label>
                                {!isPremium && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg">
                                        <Sparkles className="w-3 h-3 text-amber-600 fill-amber-600" />
                                        <span className="text-[8px] font-black text-amber-700">PREMIUM ONLY</span>
                                    </div>
                                )}
                            </div>
                            <div className={`relative ${!isPremium ? 'opacity-50' : ''}`}>
                                <input
                                    type="file"
                                    className="hidden"
                                    id="vault-file"
                                    accept="image/*,application/pdf"
                                    disabled={!isPremium}
                                    onChange={handleFileUpload}
                                />
                                <label
                                    htmlFor="vault-file"
                                    className={`flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-100 rounded-[2rem] transition-all cursor-pointer ${isPremium ? 'hover:border-primary-500 hover:bg-primary-50/10' : 'cursor-not-allowed'}`}
                                >
                                    {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-primary-600" /> : formData.fileUrl ? <div className="flex items-center gap-3 bg-primary-600 text-white px-6 py-3 rounded-xl shadow-lg animate-in zoom-in-95"><Eye className="w-4 h-4" /> <span className="text-[9px] uppercase tracking-widest">FILE READY</span></div> : <div className="text-center space-y-3"><Upload className="w-8 h-8 text-gray-300 mx-auto" /><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Drop file or click to choose</p></div>}
                                </label>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes / Booking Codes</label>
                            <textarea
                                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-primary-500 transition-all font-black text-sm min-h-[100px]"
                                placeholder="Add confirmation codes or extra details here..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-2xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            <Download className="w-5 h-5 rotate-180" />
                            SAVE TO VAULT
                        </button>
                    </form>
                </div>
            )}

            {/* List Section */}
            {documents.length === 0 ? (
                <div className="py-32 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-gray-100">
                        <FileArchive className="w-10 h-10 text-gray-200" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Vault is empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <div key={doc._id} className="group bg-white border border-gray-100 p-8 rounded-[2.5rem] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-8 opacity-[0.03] group-hover:scale-125 transition-all duration-500">
                                {getCategoryIcon(doc.category)}
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                                    {getCategoryIcon(doc.category)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1">{doc.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getFileTypeIcon(doc.fileType)}
                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">{doc.category}</span>
                                    </div>
                                </div>
                            </div>

                            {doc.notes && (
                                <div className="bg-gray-50 p-4 rounded-2xl mb-6 relative">
                                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed whitespace-pre-wrap">{doc.notes}</p>
                                </div>
                            )}

                            <div className="flex gap-2.5">
                                {doc.fileUrl ? (
                                    <button
                                        onClick={() => {
                                            const w = window.open('')
                                            w?.document.write(`<iframe width='100%' height='100%' src='${doc.fileUrl}'></iframe>`)
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> VIEW
                                    </button>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-300 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-default">
                                        <Info className="w-3.5 h-3.5" /> NO FILE
                                    </div>
                                )}
                                {!isCompleted && (
                                    <button
                                        onClick={() => deleteDocument(doc._id!)}
                                        className="w-11 h-11 flex items-center justify-center bg-gray-50 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
