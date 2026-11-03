"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import {
  Check,
  Command,
  LoaderCircle,
  Send,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "Menüye 120 TL'ye Fıstıklı Baklava ekle, açıklaması taze çıtır baklava olsun.",
  "Maraş Dondurması fiyatını 100 TL yap.",
  "Stokta kalmayan içecekleri gizle.",
];

function getToolOutput(part: UIMessage["parts"][number]): unknown {
  if ("state" in part && part.state === "output-available" && "output" in part) {
    return part.output;
  }

  return null;
}

function getConfirmationSummary(output: unknown) {
  if (
    typeof output !== "object" ||
    output === null ||
    !("summary" in output) ||
    typeof output.summary !== "string"
  ) {
    return null;
  }

  return output.summary;
}

function getChatErrorMessage(error: Error) {
  try {
    const response = JSON.parse(error.message) as unknown;

    if (
      typeof response === "object" &&
      response !== null &&
      "error" in response &&
      typeof response.error === "string"
    ) {
      return response.error;
    }
  } catch {
    return error.message;
  }

  return error.message;
}

export function MenuAiAssistant({ branchId }: { branchId: string }) {
  const [input, setInput] = useState("");
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hadActiveRequest = useRef(false);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/admin/chat?branchId=${encodeURIComponent(branchId)}`,
      }),
    [branchId],
  );
  const { messages, sendMessage, status, error, clearError } = useChat({
    transport,
  });
  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (status === "submitted" || status === "streaming") {
      hadActiveRequest.current = true;
      return;
    }

    if (status === "ready" && hadActiveRequest.current) {
      hadActiveRequest.current = false;
      router.refresh();
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();

    if (!text || isBusy) {
      return;
    }

    clearError();
    setInput("");
    await sendMessage({ text });
  }

  function setSuggestedCommand(suggestion: string) {
    setInput(suggestion);
    document.getElementById("admin-command")?.focus();
  }

  return (
    <section
      className="overflow-hidden rounded-[22px] border border-[#ebe8e0] bg-white shadow-[0_5px_20px_#3c32100a]"
      id="admin-assistant"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0eee8] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-[14px] bg-[#f5eddf] text-[#a67a36]">
            <WandSparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#464138]">
              Akdo AI asistanı
            </p>
            <p className="mt-0.5 text-[11px] text-[#938d81]">
              Türkçe yazın, menünüz güncellensin
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-lg bg-[#f7f6f2] px-2.5 py-1.5 text-[10px] text-[#8b8172] sm:inline-flex">
          <Command size={11} /> Enter ile gönder
        </span>
      </div>

      <div
        aria-live="polite"
        className="flex min-h-[300px] max-h-[460px] flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-7 text-center">
            <div className="grid size-12 place-items-center rounded-[16px] bg-[#f5eddf] text-[#a67a36]">
              <Sparkles size={21} />
            </div>
            <h3 className="font-editorial mt-3 text-xl text-[#464138]">
              Size nasıl yardımcı olayım?
            </h3>
            <p className="mt-1.5 max-w-sm text-xs leading-5 text-[#8b8172]">
              Ürün ekleyebilir, fiyat değiştirebilir veya stok durumunu
              düzenleyebilirsiniz.
            </p>
            <div className="mt-4 flex max-w-[580px] flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  className="rounded-full border border-[#ebe7df] bg-[#fdfcf9] px-3 py-2 text-left text-[10px] leading-4 text-[#675c4d] transition hover:border-[#c5a366] hover:bg-[#fff8e9]"
                  key={suggestion}
                  onClick={() => setSuggestedCommand(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}

        {isBusy && (
          <div className="flex items-center gap-2 self-start rounded-xl bg-[#f7f6f2] px-3.5 py-2.5 text-xs text-[#817769]">
            <LoaderCircle className="animate-spin text-[#a67a36]" size={15} />
            Menü güncelleniyor...
          </div>
        )}

        {error && (
          <div
            className="rounded-xl border border-[#f0d7d2] bg-[#fbefed] px-4 py-3 text-sm text-[#a63e35]"
            role="alert"
          >
            {getChatErrorMessage(error) ||
              "Komut gönderilemedi. Oturumunuzu ve sunucu bağlantınızı kontrol edin."}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="border-t border-[#f0eee8] bg-[#fdfcf9] p-3 sm:p-4"
        onSubmit={handleSubmit}
      >
        <div className="flex items-end gap-2 rounded-[15px] border border-[#e8e4db] bg-white p-2 shadow-[0_2px_8px_#43331c08] focus-within:border-[#c9aa72]">
          <Textarea
            className="max-h-32 min-h-10 resize-none border-0 bg-transparent px-2 py-2.5 text-sm shadow-none focus-visible:ring-0"
            id="admin-command"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Örn. Maraş Dondurması fiyatını 100 TL yap..."
            value={input}
          />
          <Button
            aria-label="Komutu gönder"
            className="mb-0.5 size-9 shrink-0 rounded-xl bg-[#a67a36] text-white hover:bg-[#8e6426]"
            disabled={!input.trim() || isBusy}
            size="icon"
            type="submit"
          >
            {isBusy ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
        <p className="mt-2 px-1 text-[10px] text-[#9a9184]">
          AI tarafından yapılan değişiklikler menüye anında yansır.
        </p>
      </form>
    </section>
  );
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const parts = message.parts.filter(
    (part) =>
      part.type === "text" ||
      getConfirmationSummary(getToolOutput(part)) !== null,
  );

  return (
    <div
      aria-label={isUser ? "Yönetici mesajı" : "Asistan yanıtı"}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[92%] space-y-2 sm:max-w-[82%] ${
          isUser
            ? "rounded-2xl rounded-br-md bg-[#423724] px-4 py-3 text-sm text-white"
            : "rounded-2xl rounded-bl-md bg-[#f5f4ef] px-4 py-3 text-sm text-[#40392f]"
        }`}
      >
        {parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <p
                className="whitespace-pre-wrap leading-6"
                key={`${message.id}-text-${index}`}
              >
                {part.text}
              </p>
            );
          }

          const summary = getConfirmationSummary(getToolOutput(part));

          if (!summary) {
            return null;
          }

          return (
            <div
              className="flex items-start gap-3 rounded-xl border border-[#dfe8d4] bg-white px-3.5 py-3 text-[#48593b] shadow-sm"
              key={`${message.id}-confirmation-${index}`}
              role="status"
            >
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#edf3e6]">
                <Check size={14} />
              </span>
              <span>
                <span className="block text-[10px] font-bold tracking-[0.1em] text-[#73865c]">
                  MENÜ GÜNCELLENDİ
                </span>
                <span className="mt-1 block text-xs leading-5">{summary}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
