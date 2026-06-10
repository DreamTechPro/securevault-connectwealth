import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mail } from "lucide-react";

const SUPPORT_EMAIL = "Securevaultbank.info@gmail.com";

type Msg = { role: "bot" | "user"; text: string };

const INITIAL: Msg[] = [
  {
    role: "bot",
    text: `Hi! I'm the SecureVault assistant. For any issue — withdrawals, transfers, account verification, fees, login problems or anything else — please email our customer support team at ${SUPPORT_EMAIL} and we'll get back to you right away.`,
  },
];

export function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      {
        role: "bot",
        text: `Thanks for reaching out. For the fastest help with this, please email our support team at ${SUPPORT_EMAIL} with your account email and a short description of the issue. Our team will respond as soon as possible.`,
      },
    ]);
    setInput("");
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open support chat"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full gold-gradient text-primary shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-5 z-40 w-[340px] max-w-[calc(100vw-2.5rem)] h-[460px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ animation: "scale-in 0.2s ease-out" }}
        >
          <div className="px-4 py-3 navy-gradient flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">SecureVault Support</p>
              <p className="text-xs text-white/60">We're here to help</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-background/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-500 text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mx-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs text-foreground transition-colors"
          >
            <Mail className="w-4 h-4 text-accent shrink-0" />
            <span className="font-mono truncate">{SUPPORT_EMAIL}</span>
          </a>

          <form onSubmit={send} className="p-3 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <button
              type="submit"
              className="w-10 h-10 rounded-lg gold-gradient text-primary flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
