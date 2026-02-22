'use client'

import { useState } from 'react'
import { Plus, X, AlertTriangle, Save, Trash2, HeartPulse, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Condition {
    id: string
    name: string
    severity: 'Low' | 'Medium' | 'High' | 'Critical'
    actionPlan: string
}

interface ConditionsClientProps {
    initialConditions: Condition[]
    profileData: any
}

export default function ConditionsClient({ initialConditions, profileData }: ConditionsClientProps) {
    const [conditions, setConditions] = useState<Condition[]>(initialConditions)
    const [isAdding, setIsAdding] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // New condition form state
    const [newName, setNewName] = useState('')
    const [newSeverity, setNewSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium')
    const [newActionPlan, setNewActionPlan] = useState('')

    const router = useRouter()

    const saveToServer = async (targetConditions: Condition[]) => {
        setIsSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const formData = new FormData()

            if (profileData.full_name) formData.append('full_name', profileData.full_name)
            if (profileData.phone_number) formData.append('phone_number', profileData.phone_number)
            if (profileData.blood_group) formData.append('blood_group', profileData.blood_group)
            if (profileData.dob) formData.append('dob', profileData.dob)

            if (profileData.emergency_contacts) {
                formData.append('emergency_contacts', JSON.stringify(profileData.emergency_contacts))
            }

            formData.append('serious_conditions', JSON.stringify(targetConditions))

            const response = await fetch('/api/profile', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update conditions')
            }

            setSuccess(true)
            router.refresh()
            setTimeout(() => setSuccess(false), 3000)

        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleAdd = async () => {
        if (!newName.trim()) return
        const newCondition: Condition = {
            id: Math.random().toString(36).substring(7),
            name: newName.trim(),
            severity: newSeverity,
            actionPlan: newActionPlan.trim()
        }

        const updated = [...conditions, newCondition]
        setConditions(updated)

        // Reset form directly
        setNewName('')
        setNewSeverity('Medium')
        setNewActionPlan('')
        setIsAdding(false)

        await saveToServer(updated)
    }

    const handleDelete = async (id: string) => {
        const updated = conditions.filter(c => c.id !== id)
        setConditions(updated)
        await saveToServer(updated)
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Critical': return 'bg-red-500 text-white border-red-600'
            case 'High': return 'bg-orange-500 text-white border-orange-600'
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'Low': return 'bg-blue-50 text-blue-600 border-blue-100'
            default: return 'bg-slate-100 text-slate-600'
        }
    }

    return (
        <div className="w-full max-w-sm flex flex-col gap-6 px-2">

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm border border-red-100 font-medium">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 text-sm border border-green-100 font-medium">
                    <HeartPulse className="w-5 h-5 flex-shrink-0" />
                    <p>Alerts updated successfully!</p>
                </div>
            )}

            {/* List Conditions */}
            {conditions.length === 0 && !isAdding ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-[#1e293b] font-bold text-lg mb-2">No Active Alerts</h3>
                    <p className="text-slate-500 text-sm">Add any serious conditions, severe allergies, or medical devices here.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {conditions.map((cond) => (
                        <div key={cond.id} className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-red-100 flex flex-col gap-3 relative overflow-hidden group">
                            {/* Accent Line */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${cond.severity === 'Critical' ? 'bg-red-500' : cond.severity === 'High' ? 'bg-orange-500' : 'bg-yellow-400'}`}></div>

                            <div className="flex justify-between items-start pl-2">
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-[#1e293b] text-base">{cond.name}</h3>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-max mt-1 border ${getSeverityColor(cond.severity)}`}>
                                        {cond.severity}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(cond.id)}
                                    disabled={isSaving}
                                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>

                            {cond.actionPlan && (
                                <div className="pl-2 mt-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Action Plan / Notes</p>
                                    <p className="text-sm text-slate-600 bg-red-50/50 p-3 rounded-xl border border-red-50 leading-relaxed font-medium">
                                        {cond.actionPlan}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Condition Form */}
            {isAdding ? (
                <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-blue-200 mt-2 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-[#1e293b]">New Alert</h3>
                        <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 ml-1">Condition / Allergy <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g., Severe Peanut Allergy"
                            className="w-full bg-[#f4f6fa] border-none rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-semibold"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 ml-1">Severity</label>
                        <select
                            value={newSeverity}
                            onChange={(e) => setNewSeverity(e.target.value as any)}
                            className="w-full bg-[#f4f6fa] border-none rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-semibold appearance-none"
                        >
                            <option value="Low">Low (Monitor)</option>
                            <option value="Medium">Medium (Take Medication)</option>
                            <option value="High">High (Seek Care)</option>
                            <option value="Critical">Critical (Life Threatening)</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 ml-1">Action Plan (Optional)</label>
                        <textarea
                            value={newActionPlan}
                            onChange={(e) => setNewActionPlan(e.target.value)}
                            placeholder="e.g., Use EpiPen in left pocket, call 911 immediately."
                            rows={3}
                            className="w-full bg-[#f4f6fa] border-none rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-medium resize-none"
                        />
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={!newName.trim() || isSaving}
                        className="w-full bg-slate-900 text-white rounded-xl py-3 font-bold hover:bg-black transition-colors disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                    >
                        {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving Alert...</> : 'Save Alert'}
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 rounded-2xl py-4 font-bold hover:bg-blue-100 transition-colors border border-blue-100 border-dashed mt-2 disabled:opacity-50"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Condition / Allergy</span>
                </button>
            )}
        </div>
    )
}
