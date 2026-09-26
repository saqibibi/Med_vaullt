import { createClient } from '@/utils/supabase/server'
import { Camera, User } from 'lucide-react'
import ProfileForm from './profile-form'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch existing profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    const defaultName = user.email?.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || ''
    const displayFirstName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1)

    return (
        <div className="w-full max-w-3xl mx-auto pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 select-none">
            {/* Profile Form (Dynamic Client Component) */}
            <ProfileForm 
                profile={profile} 
                displayFirstName={displayFirstName} 
                email={user.email || ''} 
                memberSince={user.created_at} 
            />
        </div>
    )
}

