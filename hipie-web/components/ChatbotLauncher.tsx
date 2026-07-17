const CHATBOT_URL = "https://hipie-rag-chat.vercel.app/";

export default function ChatbotLauncher() {
  return (
    <a
      href={CHATBOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="챗봇에게 물어보기"
      className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,0,0,0.32)]"
      style={{ background: "var(--forest)" }}
    >
      💬
    </a>
  );
}
