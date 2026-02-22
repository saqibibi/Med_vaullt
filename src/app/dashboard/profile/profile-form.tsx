'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, Droplet, Users, Plus, Trash2, Camera, AlertCircle, Loader2 } from 'lucide-react'

export default function ProfileForm({ profile, displayFirstName, email }: { profile: any, displayFirstName: string, email: string }) {

    // Parse existing JSON array of contacts, or default to one empty contact
    const initialContacts = profile?.emergency_contacts && profile.emergency_contacts.length > 0
        ? profile.emergency_contacts
        : [{ name: '', phone: '', relation: '' }];

    const router = useRouter()
    const [contacts, setContacts] = useState(initialContacts)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleAddContact = () => {
        setContacts([...contacts, { name: '', phone: '', relation: '' }])
    }

    const handleRemoveContact = (index: number) => {
        const newContacts = [...contacts]
        newContacts.splice(index, 1)
        setContacts(newContacts)
    }

    const handleContactChange = (index: number, field: string, value: string) => {
        const newContacts = [...contacts]
        newContacts[index] = { ...newContacts[index], [field]: value }
        setContacts(newContacts)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarPreview(URL.createObjectURL(file));
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setIsSaving(true)

        try {
            const formData = new FormData(e.currentTarget)
            formData.set('emergency_contacts', JSON.stringify(contacts))

            const res = await fetch('/api/profile', {
                method: 'POST',
                body: formData
            })

            const result = await res.json()

            if (!res.ok || result.error) {
                setError(result.error || 'Failed to save profile.')
                setIsSaving(false)
            } else {
                // Success! Redirect securely via Next.js router
                router.push('/dashboard')
                router.refresh() // force server refetch
            }
        } catch (err: any) {
            console.error("Fetch error:", err)
            setError(err.message || 'An unexpected network error occurred.')
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Photo Upload Area */}
            <div className="flex flex-col items-center">
                <div
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden group-hover:border-blue-200 transition-colors">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-12 h-12 text-slate-400" />
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-[#2563eb] rounded-full p-2 border-2 border-white shadow-sm group-hover:bg-blue-700 transition-colors">
                        <Camera className="w-4 h-4 text-white" />
                    </div>
                </div>
                <input
                    type="file"
                    name="avatar"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                />
                <p className="text-sm font-semibold text-[#1e293b] mt-3">{profile?.full_name || displayFirstName}</p>
                <p className="text-xs text-slate-500">{email}</p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Basic Details Section */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col gap-4">
                <h3 className="font-semibold text-[#1e293b] text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-[#2563eb]" /> Basic Details
                </h3>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500 ml-1">Full Name</label>
                    <input
                        name="full_name"
                        type="text"
                        defaultValue={profile?.full_name || ''}
                        placeholder={displayFirstName}
                        className="w-full bg-[#f4f6fa] border-none rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-medium"
                    />
                </div>

                <div className="flex gap-3">
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-xs font-medium text-slate-500 ml-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                name="phone_number"
                                type="tel"
                                defaultValue={profile?.phone_number || ''}
                                placeholder="+91 XXXXX XXXXX"
                                className="w-full bg-[#f4f6fa] border-none rounded-xl pl-9 pr-4 py-3 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 w-28">
                        <label className="text-xs font-medium text-slate-500 ml-1">Blood Group</label>
                        <div className="relative">
                            <Droplet className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                            <select
                                name="blood_group"
                                defaultValue={profile?.blood_group || ''}
                                className="w-full bg-[#f4f6fa] border-none rounded-xl pl-8 pr-2 py-3 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-medium appearance-none"
                            >
                                <option value="" disabled>Select</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* New Vital Statistics */}
                <div className="flex gap-3">
                    <div className="flex flex-col gap-1 w-full">
                        <label className="text-xs font-medium text-slate-500 ml-1">Date of Birth</label>
                        <input
                            name="dob"
                            type="date"
                            defaultValue={profile?.dob ? profile.dob.split('T')[0] : ''}
                            className="w-full bg-[#f4f6fa] border-none rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="font-semibold text-[#1e293b] text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-yellow-500" /> Emergency Contacts
                    </h3>
                    <button
                        type="button"
                        onClick={handleAddContact}
                        className="text-xs font-semibold text-[#2563eb] flex items-center gap-1 hover:text-blue-700 bg-[#eff6ff] px-2 py-1 rounded-md"
                    >
                        <Plus className="w-3 h-3" /> Add More
                    </button>
                </div>

                {contacts.map((contact: any, index: number) => (
                    <div key={index} className="flex flex-col gap-4 pb-4 border-b border-slate-50 relative group">

                        {/* Remove button only if more than 1 contact */}
                        {contacts.length > 1 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveContact(index)}
                                className="absolute -right-2 -top-2 bg-red-50 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Contact Name {index + 1}</label>
                            <input
                                type="text"
                                value={contact.name}
                                onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                placeholder="e.g. Ramesh Kumar"
                                className="w-full bg-[#fff9e6]/50 border-none rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-yellow-400/30 transition-all font-medium"
                            />
                        </div>

                        <div className="flex gap-3">
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-xs font-medium text-slate-500 ml-1">Contact Phone</label>
                                <input
                                    type="tel"
                                    value={contact.phone}
                                    onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                    placeholder="+91 XXXXX XXXXX"
                                    className="w-full bg-[#fff9e6]/50 border-none rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-yellow-400/30 transition-all font-medium"
                                />
                            </div>
                            <div className="flex flex-col gap-1 w-28">
                                <label className="text-xs font-medium text-slate-500 ml-1">Relation</label>
                                <select
                                    value={contact.relation}
                                    onChange={(e) => handleContactChange(index, 'relation', e.target.value)}
                                    className="w-full bg-[#fff9e6]/50 border-none rounded-xl px-3 py-3 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-yellow-400/30 transition-all font-medium appearance-none"
                                >
                                    <option value="" disabled>Select</option>
                                    <option value="Father">Father</option>
                                    <option value="Mother">Mother</option>
                                    <option value="Spouse">Spouse</option>
                                    <option value="Sibling">Sibling</option>
                                    <option value="Friend">Friend</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Save Button */}
            <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#2563eb] text-white rounded-xl py-3.5 font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors transform hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none"
            >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile Changes'}
            </button>

        </form>
    )
}
