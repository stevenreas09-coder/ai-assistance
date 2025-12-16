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
  const { message } = await req.json();

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
          for await (const chunk of result) {
            const text = chunk.choices?.[0]?.delta?.content;
            if (text) controller.enqueue(text);
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    } catch (err: any) {
      lastError = err;
      if (!isRetryable(err)) break;
    }
  }

  return new Response(
    JSON.stringify({ error: "All models unavailable", details: lastError }),
    { status: 503 }
  );
}
