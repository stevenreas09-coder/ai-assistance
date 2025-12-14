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

print("Loading Vosk model...")
model = vosk.Model(MODEL_PATH)
print("Model loaded")

async def recognize(websocket):
    rec = vosk.KaldiRecognizer(model, SAMPLE_RATE)
    rec.SetWords(True)

    print("Client connected")

    try:
        async for message in websocket:
            # Log message type
            print("Received message type:", type(message), "length:", len(message))

            if isinstance(message, str):
                # JSON string → likely config
                try:
                    data = json.loads(message)
                    if "config" in data:
                        print("Received config:", data["config"])
                except json.JSONDecodeError:
                    print("Received non-JSON string message:", message)
                continue  # skip to next message

            # Binary audio message (PCM)
            print("Binary audio bytes received:", len(message))

            # Process audio
            if rec.AcceptWaveform(message):
                result = json.loads(rec.Result())
                text = result.get("text", "").strip()
                if text:
                    print("Final result:", text)
                    await websocket.send(json.dumps({"text": text}))
            else:
                partial = json.loads(rec.PartialResult()).get("partial", "").strip()
                if partial:
                    print("Partial result:", partial)
                    await websocket.send(json.dumps({"partial": partial}))

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")

    finally:
        # Flush final result
        final = json.loads(rec.FinalResult()).get("text", "").strip()
        if final:
            print("Final result on disconnect:", final)
            try:
                await websocket.send(json.dumps({"text": final}))
            except:
                pass
        print("Session ended")

async def main():
    print(f"Starting Vosk server on ws://127.0.0.1:{PORT}")
    async with websockets.serve(
        recognize,
        "127.0.0.1",
        PORT,
        max_size=None,   # important for audio streaming
        ping_interval=None
    ):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
