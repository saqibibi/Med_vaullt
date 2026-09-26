'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
    User, Phone, Droplet, Users, Plus, Trash2, Camera, 
    AlertCircle, Loader2, Edit, Calendar, CheckCircle2, Lock, ChevronRight 
} from 'lucide-react'
import Image from 'next/image'

interface Contact {
    name: string
    phone: string
    relation: string
}

interface Profile {
    full_name?: string
    phone_number?: string
    blood_group?: string
    dob?: string
    avatar_url?: string
    emergency_contacts?: Contact[]
}

interface ProfileFormProps {
    profile: Profile | null
    displayFirstName: string
    email: string
    memberSince?: string
}

export default function ProfileForm({ profile, displayFirstName, email }: ProfileFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Parse existing JSON array of contacts, or default to empty array
    const initialContacts = profile?.emergency_contacts && profile.emergency_contacts.length > 0
        ? profile.emergency_contacts
        : []

    const [contacts, setContacts] = useState<Contact[]>(initialContacts)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false) // Toggle form edit state



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
        const file = e.target.files?.[0]
        if (file) {
            setAvatarPreview(URL.createObjectURL(file))
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
                setIsEditing(false)
                setIsSaving(false)
                router.refresh() // force server refetch
            }
        } catch (err: unknown) {
            const fetchErr = err instanceof Error ? err : new Error(String(err))
            console.error("Fetch error:", fetchErr)
            setError(fetchErr.message || 'An unexpected network error occurred.')
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 select-none pb-12">
            
            {/* Native File Input */}
            <input
                type="file"
                name="avatar"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
                disabled={!isEditing}
            />

            {/* Header Area */}
            <div className="flex justify-between items-center w-full">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profile</h1>
                    <p className="text-slate-400 text-xs font-bold mt-1.5 uppercase tracking-wider">
                        Manage your personal and medical information
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
                        isEditing 
                            ? 'bg-red-50 text-red-600 border border-red-200/50 shadow-red-50/50' 
                            : 'bg-primary hover:bg-sky-600 text-white shadow-sky-600/10'
                    }`}
                >
                    {isEditing ? (
                        'Cancel Edit'
                    ) : (
                        <>
                            <Edit className="w-4 h-4" />
                            Edit Profile
                        </>
                    )}
                </button>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100/80 shadow-sm relative overflow-hidden flex justify-between items-center h-[160px] group transition-all duration-300">
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-blue-50/10 to-transparent pointer-events-none -z-0" />
                
                {/* Left: User Avatar & Details */}
                <div className="flex items-center gap-6 relative z-10">
                    <div
                        className={`relative group shrink-0 ${isEditing ? 'cursor-pointer' : ''}`}
                        onClick={() => isEditing && fileInputRef.current?.click()}
                    >
                        <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center overflow-hidden relative">
                            {avatarPreview ? (
                                <Image src={avatarPreview} alt="Profile" fill className="object-cover rounded-full" unoptimized />
                            ) : (
                                <User className="w-8 h-8 text-slate-400" />
                            )}
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            {profile?.full_name || displayFirstName}
                        </h2>
                        <span className="text-xs text-slate-400 font-semibold mt-1">{email}</span>
                        <span className="flex items-center gap-1 w-max text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg mt-3 shadow-sm shadow-emerald-50/50">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" /> Verified
                        </span>
                    </div>
                </div>

                {/* Right: Beautiful Medical Illustration SVG instead of broken completion chart */}
                <div className="hidden sm:block absolute right-6 top-1/2 -translate-y-1/2 w-52 h-32 opacity-95 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Wave pulse background */}
                        <path d="M10 60 H40 L48 40 L56 80 L64 50 L72 70 L80 60 H150" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
                        {/* Concentric glow circles */}
                        <circle cx="110" cy="60" r="28" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
                        <circle cx="110" cy="60" r="38" stroke="#3b82f6" strokeWidth="1" opacity="0.1" />
                        {/* Medical emblem */}
                        <g transform="translate(92, 42)">
                            {/* Shield */}
                            <path d="M5 10 C5 10 18 7 25 3 C32 7 45 10 45 10 C45 10 48 28 25 38 C2 28 5 10 5 10 Z" fill="#2563eb" fillOpacity="0.08" stroke="#2563eb" strokeWidth="2" />
                            {/* Medical Cross */}
                            <path d="M22 12 H28 V17 H33 V23 H28 V28 H22 V23 H17 V17 H22 Z" fill="#2563eb" />
                        </g>
                    </svg>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs border border-red-100 animate-in fade-in font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <p>{error}</p>
                </div>
            )}

            {/* Basic Information Card */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100/80 shadow-sm flex flex-col gap-5">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2 ml-1">
                    <User className="w-4 h-4 text-primary" /> Basic Information
                </h3>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                    <div className="relative">
                        <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            name="full_name"
                            type="text"
                            defaultValue={profile?.full_name || ''}
                            placeholder={displayFirstName}
                            readOnly={!isEditing}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold disabled:opacity-80"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                name="phone_number"
                                type="tel"
                                defaultValue={profile?.phone_number || ''}
                                placeholder="+91 XXXXX XXXXX"
                                readOnly={!isEditing}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold disabled:opacity-80"
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Blood Group</label>
                        <div className="relative">
                            <Droplet className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                            <select
                                name="blood_group"
                                defaultValue={profile?.blood_group || ''}
                                disabled={!isEditing}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-10 py-4 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold appearance-none cursor-pointer disabled:opacity-80"
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
                            <ChevronRight className="w-4 h-4 rotate-90 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Date of Birth</label>
                    <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            name="dob"
                            type="date"
                            defaultValue={profile?.dob ? profile.dob.split('T')[0] : ''}
                            readOnly={!isEditing}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-11 py-4 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold cursor-pointer disabled:opacity-80"
                        />
                        <Calendar className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Emergency Contacts Card */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100/80 shadow-sm flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 ml-1">
                        <Users className="w-4 h-4 text-amber-500" /> Emergency Contacts
                    </h3>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleAddContact}
                            className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-white transition-all bg-blue-50 hover:bg-blue-600 px-3.5 py-2 rounded-xl border border-blue-100 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5 inline-block mr-1" /> Add Contact
                        </button>
                    )}
                </div>

                {contacts.length === 0 ? (
                    <div className="bg-amber-50/30 rounded-2xl p-6 border border-amber-100/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-extrabold text-sm shrink-0">
                                S
                            </div>
                            <div className="flex flex-col">
                                <h4 className="font-extrabold text-slate-800 text-sm">No contacts added yet</h4>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-normal max-w-xs">
                                    Add emergency contacts to keep your loved ones informed in critical situations.
                                </p>
                            </div>
                        </div>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleAddContact}
                                className="text-[10px] font-black uppercase tracking-wider text-orange-600 hover:text-white transition-all hover:bg-orange-500 px-4 py-2.5 rounded-xl border border-orange-200 cursor-pointer shrink-0"
                            >
                                + Add Contact
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {contacts.map((contact, index) => (
                            <div key={index} className="flex flex-col gap-5 pb-6 border-b border-slate-100 relative group last:border-0 last:pb-0 last:mb-0">
                                {/* Remove button */}
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveContact(index)}
                                        className="absolute -right-1 -top-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-xl border border-red-100 hover:border-transparent transition-all shadow-sm cursor-pointer"
                                        title="Remove Contact"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Name</label>
                                    <div className="relative">
                                        <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={contact.name}
                                            onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                            placeholder="Contact Name"
                                            readOnly={!isEditing}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold disabled:opacity-80"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Phone</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="tel"
                                                value={contact.phone}
                                                onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                                placeholder="+91 XXXXX XXXXX"
                                                readOnly={!isEditing}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold disabled:opacity-80"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Relation</label>
                                        <div className="relative">
                                            <Users className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <select
                                                value={contact.relation}
                                                onChange={(e) => handleContactChange(index, 'relation', e.target.value)}
                                                disabled={!isEditing}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-10 py-4 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold appearance-none cursor-pointer disabled:opacity-80"
                                            >
                                                <option value="" disabled>Select</option>
                                                <option value="Father">Father</option>
                                                <option value="Mother">Mother</option>
                                                <option value="Spouse">Spouse</option>
                                                <option value="Sibling">Sibling</option>
                                                <option value="Friend">Friend</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <ChevronRight className="w-4 h-4 rotate-90 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Information Secure Lock Banner */}
            <div className="w-full bg-blue-50/40 rounded-3xl p-6 border border-blue-100/50 flex items-center justify-between relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-200/50 shrink-0">
                        <Lock className="w-5.5 h-5.5 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                        <h4 className="font-extrabold text-slate-800 text-sm">Your information is secure and encrypted</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-normal max-w-xs sm:max-w-md">
                            We follow industry-standard security protocols to keep your data safe and private.
                        </p>
                    </div>
                </div>
                
                {/* Shield with lock watermark on the right */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-25 w-24 h-24 pointer-events-none hidden sm:block">
                    <svg className="w-full h-full text-blue-100" viewBox="0 0 100 100" fill="currentColor">
                        <path d="M50,15 L80,25 L80,55 C80,75 50,90 50,90 C50,90 20,75 20,55 L20,25 Z" fill="none" stroke="currentColor" strokeWidth="5" />
                        <rect x="42" y="48" width="16" height="14" rx="2" />
                        <path d="M46,48 V42 A4,4 0 0,1 54,42 V48" fill="none" stroke="currentColor" strokeWidth="4" />
                    </svg>
                </div>
            </div>

            {/* Submit Action Button (Only visible when editing) */}
            {isEditing && (
                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-primary hover:bg-sky-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-sky-600/10 transition-all hover:translate-y-[-1px] active:translate-y-[0px] mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none cursor-pointer text-sm"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile Changes'}
                </button>
            )}

        </form>
    )
}
