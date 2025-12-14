import json
import asyncio
import sounddevice as sd
import websockets
from vosk import Model, KaldiRecognizer

# ---------------- CONFIG ---------------- #
MODEL_PATH = "model/vosk-model-en-us-0.22-lgraph"
SAMPLE_RATE = 16000
BLOCKSIZE = 4000  # smaller = lower latency
# ---------------------------------------- #

# Load model
model = Model(MODEL_PATH)

async def speech_server(websocket):
    loop = asyncio.get_event_loop()
    rec = KaldiRecognizer(model, SAMPLE_RATE)

    print("Client connected")

    def callback(indata, frames, time, status):
        if status:
            print(f"⚠️ {status}")
        try:
            # Convert buffer to bytes (works for RawInputStream)
            data_bytes = bytes(indata)

            if rec.AcceptWaveform(data_bytes):
                result = json.loads(rec.Result())
                text = result.get("text", "")
                if text:
                    print("Final:", text)
                    if websocket:
                        asyncio.run_coroutine_threadsafe(websocket.send(text), loop)
            else:
                result = json.loads(rec.PartialResult())
                text = result.get("partial", "")
                if text:
                    print("Partial:", text)
                    if websocket:
                        asyncio.run_coroutine_threadsafe(websocket.send(text), loop)
        except Exception as e:
            print(f"Callback error: {e}")

    try:
        with sd.RawInputStream(
            samplerate=SAMPLE_RATE,
            blocksize=BLOCKSIZE,
            dtype="int16",
            channels=1,
            callback=callback,
        ):
            print("🎤 Listening...")
            await websocket.wait_closed()  # Keep connection alive
    except Exception as e:
        print(f"Audio stream error: {e}")

async def main():
    async with websockets.serve(speech_server, "localhost", 8765):
        print("Vosk server running on ws://localhost:8765")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
