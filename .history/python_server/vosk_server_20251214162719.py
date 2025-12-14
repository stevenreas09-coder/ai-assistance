import json
import asyncio
import sounddevice as sd
import websockets
from vosk import Model, KaldiRecognizer

# ---------------- CONFIG ---------------- #
MODEL_PATH = "model/vosk-model-en-us-0.22-lgraph"
SAMPLE_RATE = 16000
BLOCKSIZE = 4000  # smaller = lower latency
MIC_INDEX = 1      # <-- Use the correct device index from test_mic.py
# ---------------------------------------- #

# Set default input device explicitly
sd.default.device = MIC_INDEX

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
            data_bytes = indata.tobytes()

            if rec.AcceptWaveform(data_bytes):
                result = json.loads(rec.Result())
                text = result.get("text", "")
                if text:
                    print("Final:", text)  # <-- Print to console
                    asyncio.run_coroutine_threadsafe(websocket.send(text), loop)
            else:
                result = json.loads(rec.PartialResult())
                text = result.get("partial", "")
                if text:
                    print("Partial:", text)  # <-- Print to console
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

# --------- Test mode without websocket --------- #
async def test_mic():
    print("Starting test mode... Speak into the mic.")
    rec = KaldiRecognizer(model, SAMPLE_RATE)

    def callback(indata, frames, time, status):
        if status:
            print(f"⚠️ {status}")
        data_bytes = indata.tobytes()
        if rec.AcceptWaveform(data_bytes):
            result = json.loads(rec.Result())
            text = result.get("text", "")
            if text:
                print("Final:", text)
        else:
            result = json.loads(rec.PartialResult())
            text = result.get("partial", "")
            if text:
                print("Partial:", text)

    with sd.RawInputStream(
        samplerate=SAMPLE_RATE,
        blocksize=BLOCKSIZE,
        dtype="int16",
        channels=1,
        callback=callback,
    ):
        await asyncio.Future()  # Run forever

async def main():
    # Uncomment one of the two lines below
    # await speech_server(None)   # Only for websocket mode
    await websockets.serve(speech_server, "localhost", 8765)
    print("Vosk server running on ws://localhost:8765")
    await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(test_mic())  # <-- Use test mode first
    # asyncio.run(main())    # <-- Uncomment this later for Electron/Next.js
