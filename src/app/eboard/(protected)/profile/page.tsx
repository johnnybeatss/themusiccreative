import { getMyProfile } from "@/lib/supabase/role";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const profile = await getMyProfile();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        MY PROFILE
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Set the name other E-Board members see next to things you post.
      </p>
      <ProfileForm currentName={profile?.displayName ?? null} />
    </div>
  );
}
