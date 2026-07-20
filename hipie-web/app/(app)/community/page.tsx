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
        <div className="flex flex-col gap-4">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/community/${p.id}`}
              className="block rounded-2xl border border-[var(--line)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6"
            >
              {/* 작성자 */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--forest-light)] text-lg">
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
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[14px] font-bold text-[var(--ink)]">
                    <span className="truncate">
                      {p.author?.nickname ?? "익명"}
                    </span>
                    <span className="flex-shrink-0 rounded-full bg-[var(--forest-light)] px-2 py-0.5 text-[11.5px] font-bold text-[var(--forest)]">
                      🥣 {p.author?.manner_score ?? 50}
                    </span>
                  </p>
                  <p className="text-[12.5px] text-[var(--muted)]">
                    {timeAgo(p.created_at)}
                  </p>
                </div>
              </div>

              {/* 제목 + 내용 미리보기 */}
              <h4 className="mt-3 line-clamp-1 text-[17px] font-bold text-[var(--ink)]">
                {p.title}
              </h4>
              {p.content && (
                <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--muted)]">
                  {p.content}
                </p>
              )}

              {/* 사진 최대 4장 미리보기 */}
              <PostImages images={p.images ?? []} />

              {/* 댓글 수 */}
              <div className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
                💬 댓글 {p.comment_count ?? 0}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function PostImages({ images }: { images: string[] }) {
  const imgs = images.slice(0, 4);
  const extra = images.length - imgs.length;
  if (imgs.length === 0) return null;

  const single = imgs.length === 1;

  return (
    <div
      className={`mt-3.5 grid gap-1.5 ${single ? "grid-cols-1" : "grid-cols-2"}`}
    >
      {imgs.map((src, idx) => (
        <div
          key={src}
          className={`relative overflow-hidden rounded-xl bg-[var(--forest-light)] ${
            single ? "h-52 sm:h-64" : "h-32 sm:h-40"
          } ${imgs.length === 3 && idx === 0 ? "col-span-2" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-cover" />
          {extra > 0 && idx === imgs.length - 1 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xl font-bold text-white">
              +{extra}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
