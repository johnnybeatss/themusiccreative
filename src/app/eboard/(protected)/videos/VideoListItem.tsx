"use client";

import { deleteVideo } from "./actions";

export default function VideoListItem({
  video,
  editable,
}: {
  video: {
    id: string;
    video_url: string;
    caption: string;
    instagram_url: string;
    storage_path: string;
  };
  editable: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-navy-800 bg-navy-900 p-4 transition-colors hover:border-gold">
      <video
        src={video.video_url}
        muted
        playsInline
        className="h-20 w-16 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ivory">{video.caption}</p>
        <a
          href={video.instagram_url}
          target="_blank"
          rel="noreferrer"
          className="truncate text-xs text-gold underline"
        >
          {video.instagram_url}
        </a>
      </div>
      {editable && (
        <form
          action={deleteVideo}
          onSubmit={(e) => {
            if (
              !confirm(`Remove "${video.caption}" from the feed wheel?`)
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={video.id} />
          <input
            type="hidden"
            name="storage_path"
            value={video.storage_path}
          />
          <button
            type="submit"
            className="shrink-0 text-xs text-steel-light hover:text-red-400"
          >
            Delete
          </button>
        </form>
      )}
    </div>
  );
}
