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
        <div className="w-full flex flex-col items-center pb-8">

            {/* Header */}
            <div className="text-center mt-6 mb-8 w-full relative">
                <h1 className="text-2xl font-bold text-[#1e293b]">My Profile</h1>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-6">

                {/* Profile Form (Dynamic Client Component) */}
                <ProfileForm profile={profile} displayFirstName={displayFirstName} email={user.email || ''} />

            </div>
        </div>
    )
}
