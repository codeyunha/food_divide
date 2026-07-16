"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

export default function Chat({
  roomId,
  userId,
  initialMessages,
  names,
}: {
  roomId: string;
  userId: string;
  initialMessages: Message[];
  names: Record<string, string>;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((p) => p.id === m.id) ? prev : [...prev, m]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    await supabase
      .from("messages")
      .insert({ room_id: roomId, sender_id: userId, content });
  }

  return (
    <div className="flex h-[440px] flex-col rounded-2xl border border-[var(--line)] bg-white">
      <div className="border-b border-[var(--line)] px-5 py-3 text-sm font-bold text-[var(--ink)]">
        💬 파티 채팅방
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--muted)]">
            첫 메시지를 보내보세요!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div
              key={m.id}
              className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
            >
              {!mine && (
                <span className="mb-0.5 text-[11px] text-[var(--muted)]">
                  {names[m.sender_id] ?? "익명"}
                </span>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine
                    ? "bg-[var(--forest)] text-white"
                    : "bg-[var(--forest-light)] text-[var(--ink)]"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-[var(--line)] p-3">
        <input
          className="flex-1 rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          placeholder="메시지를 입력하세요"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-xl px-5 text-sm font-bold text-white"
          style={{ background: "var(--forest)" }}
        >
          전송
        </button>
      </form>
    </div>
  );
}
