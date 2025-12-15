import asyncio
import json
import websockets
import vosk
import sys
import os

MODEL_PATH = "model/vosk-model-en-us-0.22-lgraph"
SAMPLE_RATE = 16000
PORT = 8765

if not os.path.exists(MODEL_PATH):
    print(f"Model not found at {MODEL_PATH}", file=sys.stderr)
    sys.exit(1)

model = vosk.Model(MODEL_PATH)

async def recognize(websocket):
    rec = vosk.KaldiRecognizer(model, SAMPLE_RATE)
    rec.SetWords(True)

    last_partial = ""
    finalized_texts = set()

    async for message in websocket:
        if isinstance(message, str):
            continue  # config ignored
        else:
            if rec.AcceptWaveform(message):
                result = json.loads(rec.Result())
                text = result.get("text", "").strip()

                if text and text not in finalized_texts:
                    finalized_texts.add(text)
                    await websocket.send(json.dumps({
                        "text": text,
                        "reset": True
                    }))
                    last_partial = ""
            else:
                partial = json.loads(rec.PartialResult()).get("partial", "").strip()

                if partial and partial != last_partial:
                    last_partial = partial
                    await websocket.send(json.dumps({"partial": partial}))

    # Send final result ONCE
    final = json.loads(rec.FinalResult()).get("text", "").strip()
    if final and final not in finalized_texts:
        try:
            await websocket.send(json.dumps({
                "text": final,
                "reset": True
            }))
        except:
            pass

async def main():
    async with websockets.serve(
        recognize,
        "127.0.0.1",
        PORT,
        max_size=None,
        ping_interval=None
    ):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
