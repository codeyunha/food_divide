import Link from "next/link";
import PageHead from "@/components/PageHead";
import { listPosts } from "@/lib/queries";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const posts = await listPosts();

  return (
    <>
      <PageHead
        title="💬 커뮤니티"
        subtitle="이웃과 소분 팁, 레시피 후기, 잡담을 나눠보세요"
        action={
          <Link
            href="/community/new"
            className="flex items-center gap-1.5 rounded-xl px-6 py-3 text-[15px] font-bold text-white transition hover:opacity-90"
            style={{ background: "var(--forest)" }}
          >
            <span className="text-lg leading-none">＋</span> 글쓰기
          </Link>
        }
      />

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-12 text-center text-base text-[var(--muted)]">
          아직 게시글이 없어요. 첫 글을 남겨보세요!
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          {posts.map((p, i) => (
            <Link
              key={p.id}
              href={`/community/${p.id}`}
              className={`flex items-center gap-4 px-7 py-5 transition hover:bg-[var(--forest-light)]/40 ${
                i > 0 ? "border-t border-[var(--line)]" : ""
              }`}
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--forest-light)] text-xl">
                {p.author?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.author.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "🐤"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-base font-bold text-[var(--ink)]">
                  {p.title}
                  {p.images?.length > 0 && (
                    <span className="ml-1.5 text-[13px] text-[var(--muted)]">📷</span>
                  )}
                </h4>
                <p className="mt-1 truncate text-[13px] text-[var(--muted)]">
                  {p.author?.nickname ?? "익명"} · {timeAgo(p.created_at)}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-[var(--cream)] px-3.5 py-2 text-[13px] font-bold text-[var(--forest)]">
                💬 {p.comment_count ?? 0}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
