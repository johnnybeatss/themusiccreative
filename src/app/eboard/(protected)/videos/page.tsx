import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
import VideoUploadForm from "./VideoUploadForm";
import VideoListItem from "./VideoListItem";

const BUCKET = "feed-videos";

type FeedVideo = {
  id: string;
  storage_path: string;
  caption: string;
  instagram_url: string;
  sort_order: number;
};

async function getFeedVideos(): Promise<
  (FeedVideo & { video_url: string })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feed_videos")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("Failed to load feed videos:", error.message);
    return [];
  }
  return (data ?? []).map((v) => ({
    ...v,
    video_url: supabase.storage.from(BUCKET).getPublicUrl(v.storage_path)
      .data.publicUrl,
  }));
}

// Only place videos get added/removed — the homepage wheel just reads this
// same table and is read-only by RLS (public SELECT, no anonymous write).
export default async function VideosAdminPage() {
  const [videos, role] = await Promise.all([getFeedVideos(), getEffectiveRole()]);
  const editable = canManage(role);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        FEED VIDEOS
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        {editable
          ? "Manage the clips that autoplay in the homepage “Straight From The Feed” wheel."
          : "What's currently in the homepage feed wheel. Adding and removing clips is limited to owner/admin accounts."}
      </p>

      {editable && <VideoUploadForm />}

      {videos.length === 0 ? (
        <p className="mt-6 text-steel-light">
          No videos yet — the feed wheel is hidden on the homepage until at
          least one is added.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {videos.map((v) => (
            <VideoListItem key={v.id} video={v} editable={editable} />
          ))}
        </div>
      )}
    </div>
  );
}
