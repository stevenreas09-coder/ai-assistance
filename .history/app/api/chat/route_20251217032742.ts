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
    err?.message?.includes("overloaded")
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    // Basic validation
    if (typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400,
      });
    }

    const openRouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    let lastError;

    for (const model of MODELS) {
      try {
        const result = await openRouter.chat.send({
          model,
          messages: [{ role: "user", content: message }],
          stream: true,
        });

        const stream = new ReadableStream({
          async start(controller) {
            try {
              const encoder = new TextEncoder();
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
          },
        });
      } catch (err: any) {
        lastError = err;
        if (!isRetryable(err)) break;
        // Add a delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return new Response(
      JSON.stringify({
        error: "All models unavailable",
        details: lastError?.message || "Unknown error",
      }),
      { status: 503 }
    );
  } catch (err: any) {
    // Catch any top-level errors (e.g., JSON parsing)
    return new Response(
      JSON.stringify({ error: "Request failed", details: err.message }),
      { status: 500 }
    );
  }
}
