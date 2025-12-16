import { OpenRouter } from "@openrouter/sdk";

const MODELS = [
  "google/gemini-2.5-flash",
  "x-ai/grok-code-fast-1",
  "openai/gpt-oss-120b",
  "mistralai/devstral-2512:free",
];

function isRetryable(err: any) {
  return (
    err?.status === 429 ||
    err?.status === 503 ||
    err?.message?.toLowerCase?.().includes("overloaded")
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, maxTokens = 2000 } = body;

    /* ----------------- Validation ----------------- */
    if (typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400,
      });
    }

    if (typeof maxTokens !== "number" || maxTokens < 1 || maxTokens > 10000) {
      return new Response(
        JSON.stringify({ error: "Invalid maxTokens (1–10000)" }),
        { status: 400 }
      );
    }

    /* ----------------- OpenRouter ----------------- */
    const openRouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    let lastError: any = null;

    /* ----------------- Model fallback ----------------- */
    for (const model of MODELS) {
      try {
        const result = await openRouter.chat.send({
          model,
          messages: [{ role: "user", content: message }],
          maxTokens, // ✅ camelCase (SDK)
          stream: true, // ✅ streaming overload
        });

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const encoder = new TextEncoder();
            try {
              for await (const chunk of result) {
                const text = chunk.choices?.[0]?.delta?.content;
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              }
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            "X-Model-Used": model,
          },
        });
      } catch (err: any) {
        lastError = err;
        console.error(`Model failed: ${model}`, err);

        /* ---------- Insufficient credits ---------- */
        if (err?.status === 402) {
          return new Response(
            JSON.stringify({
              error: "Insufficient credits",
              details:
                "Your OpenRouter account needs more credits. Reduce maxTokens or upgrade your plan.",
              suggestedMaxTokens: Math.min(maxTokens, 1000),
            }),
            { status: 402 }
          );
        }

        if (!isRetryable(err)) break;

        // Backoff before next model
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));
      }
    }

    /* ----------------- All models failed ----------------- */
    return new Response(
      JSON.stringify({
        error: "All models unavailable",
        details: lastError?.message ?? "Unknown error",
      }),
      { status: 503 }
    );
  } catch (err: any) {
    /* ----------------- Fatal error ----------------- */
    return new Response(
      JSON.stringify({
        error: "Request failed",
        details: err?.message ?? "Unknown error",
      }),
      { status: 500 }
    );
  }
}
