import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPost, listComments } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import PostActions from "./PostActions";
import CommentSection from "./CommentSection";
import PostMannerVoteButtons from "@/components/PostMannerVoteButtons";

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

  // 작성자 "내 그릇" 좋아요/싫어요 — 로그인 & 본인 글 아님
  let myPostVote: 1 | -1 | null = null;
  if (user && !isAuthor) {
    const { data: voteRow } = await supabase
      .from("post_manner_votes")
      .select("vote")
      .eq("post_id", id)
      .eq("voter_id", user.id)
      .maybeSingle();
    myPostVote = (voteRow?.vote as 1 | -1 | undefined) ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/community"
        className="mb-5 inline-block text-sm text-[var(--muted)] hover:text-[var(--forest)]"
      >
        ← 목록으로
      </Link>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--forest-light)] text-2xl">
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
              <p className="flex items-center gap-1.5 text-[15px] font-bold text-[var(--ink)]">
                {post.author?.nickname ?? "익명"}
                <span className="rounded-full bg-[var(--forest-light)] px-2 py-0.5 text-[12px] font-bold text-[var(--forest)]">
                  🥣 {post.author?.manner_score ?? 50}
                </span>
              </p>
              <p className="text-[13px] text-[var(--muted)]">
                {timeAgo(post.created_at)}
                {post.updated_at !== post.created_at && " · 수정됨"}
              </p>
            </div>
          </div>
          {isAuthor && <PostActions postId={post.id} />}
        </div>

        <h1 className="mb-6 text-3xl font-bold text-[var(--ink)]">{post.title}</h1>

        {post.images?.length > 0 && (
          <div className="mb-6 flex flex-col gap-3.5">
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

        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink)]">
          {post.content}
        </div>
      </div>

      {/* 작성자 "내 그릇" 좋아요/싫어요 평가 */}
      {user && !isAuthor && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-[var(--line)] bg-white p-6 text-center">
          <p className="text-[14px] text-[var(--muted)]">
            <b className="text-[var(--ink)]">
              {post.author?.nickname ?? "익명"}
            </b>
            님의 🥣 내 그릇 점수는{" "}
            <b className="text-[var(--forest)]">
              {post.author?.manner_score ?? 50}
            </b>
            점이에요
          </p>
          <PostMannerVoteButtons postId={post.id} myVote={myPostVote} />
        </div>
      )}

      <CommentSection
        postId={post.id}
        userId={user?.id ?? null}
        initialComments={comments}
      />
    </div>
  );
}
