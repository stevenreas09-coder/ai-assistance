import { OpenRouter } from "@openrouter/sdk";

const MODELS = [
  "openai/gpt-5",
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
  "mistral/mixtral-8x7b",
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
