"use client";

import { useMemo, useRef, useState } from "react";
import { Bot, ImagePlus, MessageCircle, SendHorizontal, Sparkles, X } from "lucide-react";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
  image?: string;
};

type ApiResponse = {
  answer: string;
  confidence: number;
  intent: string;
  suggestions: string[];
};

type LocalImageMetrics = {
  width: number;
  height: number;
  avgBrightness: number;
  contrast: number;
  redRatio: number;
  darkRatio: number;
  highlightRatio: number;
};

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "I am your TensorFlow.js skincare assistant. Ask a precise question about products, ingredients, routine, or pricing.",
};

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Which product is good for dry skin?",
    "Which ingredients appear most frequently?",
    "Give me a simple AM/PM routine.",
  ]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canSend = input.trim().length > 0 && !isLoading;

  const title = useMemo(() => {
    return isLoading ? "Assistant analyzing..." : "AI skincare assistant";
  }, [isLoading]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (!scrollContainerRef.current) return;
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    });
  };

  const sendMessage = async (value: string) => {
    const question = value.trim();
    if (!question || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setIsLoading(true);
    scrollToBottom();

    try {
      const response = await fetch("/api/chatbot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as ApiResponse;
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions.slice(0, 3));
      }
    } catch (error) {
      console.error("Chatbot request failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not answer right now. Check your connection and ask again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        if (!result.startsWith("data:image/")) {
          reject(new Error("Invalid image format"));
          return;
        }
        resolve(result);
      };
      reader.onerror = () => reject(new Error("Image read failed"));
      reader.readAsDataURL(file);
    });
  };

  const computeLocalImageMetrics = (dataUrl: string): Promise<LocalImageMetrics> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 256;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        let lumSum = 0;
        let lumSqSum = 0;
        let redSum = 0;
        let greenSum = 0;
        let blueSum = 0;
        let darkCount = 0;
        let highlightCount = 0;

        const pixelCount = width * height;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

          lumSum += lum;
          lumSqSum += lum * lum;
          redSum += r;
          greenSum += g;
          blueSum += b;

          if (lum < 45) darkCount += 1;
          if (lum > 220) highlightCount += 1;
        }

        const avgBrightness = lumSum / pixelCount;
        const variance = Math.max(0, lumSqSum / pixelCount - avgBrightness * avgBrightness);
        const contrast = Math.sqrt(variance);
        const totalRgb = redSum + greenSum + blueSum;
        const redRatio = totalRgb > 0 ? redSum / totalRgb : 0;

        resolve({
          width,
          height,
          avgBrightness,
          contrast,
          redRatio,
          darkRatio: darkCount / pixelCount,
          highlightRatio: highlightCount / pixelCount,
        });
      };

      img.onerror = () => reject(new Error("Image decode failed"));
      img.src = dataUrl;
    });
  };

  const handleImagePicked = async (file?: File | null) => {
    if (!file) return;
    if (isLoading) return;

    if (!file.type.startsWith("image/")) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "The selected file is not a valid image.",
        },
      ]);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setSelectedImage(dataUrl);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Image is ready. Click the image icon again to run the analysis.",
        },
      ]);
      scrollToBottom();
    } catch (error) {
      console.error("Image parse failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to read this image. Try another file.",
        },
      ]);
    }
  };

  const sendImageForAnalysis = async () => {
    if (!selectedImage || isLoading) {
      fileInputRef.current?.click();
      return;
    }

    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: "Analyze this skin image",
        image: selectedImage,
      },
    ]);
    scrollToBottom();

    try {
      const localMetrics = await computeLocalImageMetrics(selectedImage);

      const response = await fetch("/api/chatbot/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          question: input.trim() || undefined,
          imageMetrics: localMetrics,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as ApiResponse;
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions.slice(0, 3));
      }
      setSelectedImage(null);
      setInput("");
    } catch (error) {
      console.error("Chatbot image analysis failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not analyze the image right now. Retry with a clear frontal image.",
        },
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-[0_12px_30px_rgba(8,145,178,0.45)] transition-transform duration-200 hover:scale-105"
        aria-label="Open chatbot"
      >
        {isOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-95 rounded-2xl border border-cyan-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-linear-to-r from-cyan-600 to-emerald-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-[11px] opacity-90">Model trained on your skincare CSV files</p>
            </div>
            <Sparkles className="size-4" />
          </div>

          <div
            ref={scrollContainerRef}
            className="max-h-[45vh] space-y-3 overflow-y-auto px-3 py-3"
          >
            {messages.map((message, index) => {
              const isAssistant = message.role === "assistant";
              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      isAssistant
                        ? "bg-cyan-50 text-slate-800"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    {isAssistant && <Bot className="mb-1 size-3.5 opacity-70" />}
                    {message.content}
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Uploaded skin"
                        className="mt-2 h-24 w-24 rounded-lg border border-white/30 object-cover"
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
                Analysis in progress...
              </div>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="border-t border-slate-100 px-3 py-2">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Suggestions
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[11px] text-cyan-900 transition-colors hover:bg-cyan-100"
                    onClick={() => void sendMessage(suggestion)}
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            className="border-t border-slate-100 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(event) => {
                void handleImagePicked(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />

            {selectedImage && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 p-2">
                <img src={selectedImage} alt="Preview" className="h-12 w-12 rounded-md object-cover" />
                <p className="text-xs text-cyan-900">
                  Image is ready. Click the image icon to run the analysis.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void sendImageForAnalysis()}
                disabled={isLoading}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Analyze image"
                title="Add/Analyze image"
              >
                <ImagePlus className="size-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Example: analyze this image and suggest a routine"
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-cyan-400 transition focus:ring"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="Send"
              >
                <SendHorizontal className="size-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
