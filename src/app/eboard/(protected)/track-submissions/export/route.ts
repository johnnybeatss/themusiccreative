import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { buildXlsxResponse } from "@/lib/exportXlsx";

export async function GET() {
  const role = await getMyRole();
  if (!canManage(role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("track_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const rows = (data ?? []).map((s) => ({
    "Submitted": new Date(s.created_at).toLocaleString(),
    "Track Title": s.track_title,
    "Artist": s.artist_name,
    "Instagram": s.artist_instagram_url,
    "Spotify": s.spotify_url ?? "",
    "Apple Music": s.apple_music_url ?? "",
    "Has Audio File": s.storage_path ? "Yes" : "No",
    "Featured": s.featured_at
      ? new Date(s.featured_at).toLocaleString()
      : "",
  }));

  return buildXlsxResponse(rows, "track-submissions.xlsx");
}
