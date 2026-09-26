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
            case 'Critical': return 'bg-red-50 text-red-700 border-red-200'
            case 'High': return 'bg-orange-50 text-orange-700 border-orange-200'
            case 'Medium': return 'bg-amber-50 text-amber-800 border-amber-200'
            case 'Low': return 'bg-sky-50 text-sky-700 border-sky-200'
            default: return 'bg-slate-50 text-slate-600 border-slate-200'
        }
    }

    return (
        <div className="w-full max-w-sm flex flex-col gap-6 px-2 select-none">

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-100 font-semibold">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 text-sm border border-green-100 font-semibold animate-in fade-in">
                    <HeartPulse className="w-5 h-5 flex-shrink-0 text-green-600" />
                    <p>Alerts updated successfully!</p>
                </div>
            )}

            {/* List Conditions */}
            {conditions.length === 0 && !isAdding ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100/50">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-slate-800 font-bold text-lg mb-2">No Active Alerts</h3>
                    <p className="text-slate-400 text-sm font-semibold leading-relaxed">Add any critical conditions, severe allergies, or emergency medical devices here.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {conditions.map((cond) => (
                        <div key={cond.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden group">
                            {/* Accent Line */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${cond.severity === 'Critical' ? 'bg-red-500' : cond.severity === 'High' ? 'bg-orange-500' : 'bg-amber-500'}`}></div>

                            <div className="flex justify-between items-start pl-2">
                                <div className="flex flex-col min-w-0">
                                    <h3 className="font-bold text-slate-800 text-base truncate">{cond.name}</h3>
                                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider w-max mt-1.5 border ${getSeverityColor(cond.severity)}`}>
                                        {cond.severity}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(cond.id)}
                                    disabled={isSaving}
                                    className="p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 text-slate-400 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>

                            {cond.actionPlan && (
                                <div className="pl-2 mt-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Action Plan / Notes</p>
                                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-semibold">
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
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mt-2 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800 text-sm">New Alert</h3>
                        <button onClick={() => setIsAdding(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Condition / Allergy <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g., Severe Peanut Allergy"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Severity</label>
                        <select
                            value={newSeverity}
                            onChange={(e) => setNewSeverity(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-4 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold appearance-none cursor-pointer"
                        >
                            <option value="Low">Low (Monitor)</option>
                            <option value="Medium">Medium (Take Medication)</option>
                            <option value="High">High (Seek Care)</option>
                            <option value="Critical">Critical (Life Threatening)</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Action Plan (Optional)</label>
                        <textarea
                            value={newActionPlan}
                            onChange={(e) => setNewActionPlan(e.target.value)}
                            placeholder="e.g., Use EpiPen in left pocket, call 911 immediately."
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all font-semibold resize-none"
                        />
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={!newName.trim() || isSaving}
                        className="w-full bg-primary hover:bg-sky-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-sky-600/10 transition-all hover:translate-y-[-1px] active:translate-y-[0px] mt-2 flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                        {isSaving ? <><Loader2 className="w-4 h-4 animate-spin text-white/50" /> Saving Alert...</> : 'Save Alert'}
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-primary/5 text-primary rounded-2xl py-4 font-bold hover:bg-primary/10 transition-all border border-primary/20 border-dashed mt-2 disabled:opacity-50 cursor-pointer text-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Condition / Allergy</span>
                </button>
            )}
        </div>
    )
}
