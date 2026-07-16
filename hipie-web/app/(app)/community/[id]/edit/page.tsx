import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPost } from "@/lib/queries";
import PageHead from "@/components/PageHead";
import EditPostForm from "./EditPostForm";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const post = await getPost(id);
  if (!post) notFound();
  if (!user || user.id !== post.author_id) redirect(`/community/${id}`);

  return (
    <div className="max-w-2xl">
      <PageHead title="글 수정" />
      <EditPostForm
        postId={post.id}
        initialTitle={post.title}
        initialContent={post.content}
      />
    </div>
  );
}
