import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPost, listComments } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import PostActions from "./PostActions";
import CommentSection from "./CommentSection";

export const dynamic = "force-dynamic";

export default async function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [post, comments] = await Promise.all([getPost(id), listComments(id)]);
  if (!post) notFound();

  const isAuthor = !!user && user.id === post.author_id;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/community"
        className="mb-5 inline-block text-sm text-[var(--muted)] hover:text-[var(--forest)]"
      >
        ← 목록으로
      </Link>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-7">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--forest-light)] text-xl">
              {post.author?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                "🐤"
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--ink)]">
                {post.author?.nickname ?? "익명"}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {timeAgo(post.created_at)}
                {post.updated_at !== post.created_at && " · 수정됨"}
              </p>
            </div>
          </div>
          {isAuthor && <PostActions postId={post.id} />}
        </div>

        <h1 className="mb-5 text-2xl font-bold text-[var(--ink)]">{post.title}</h1>

        {post.images?.length > 0 && (
          <div className="mb-5 flex flex-col gap-3">
            {post.images.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt="첨부 이미지"
                className="w-full rounded-xl object-cover"
              />
            ))}
          </div>
        )}

        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
          {post.content}
        </div>
      </div>

      <CommentSection
        postId={post.id}
        userId={user?.id ?? null}
        initialComments={comments}
      />
    </div>
  );
}
