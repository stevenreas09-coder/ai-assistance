import json
import asyncio
import sounddevice as sd
import websockets
from vosk import Model, KaldiRecognizer

# ---------------- CONFIG ---------------- #
MODEL_PATH = "vosk-model-en-us-0.22-lgraph"
SAMPLE_RATE = 16000
BLOCKSIZE = 4000  # smaller = lower latency
# ---------------------------------------- #

# Load model
model = Model(MODEL_PATH)

async def speech_server(websocket):
    loop = asyncio.get_event_loop()
    rec = KaldiRecognizer(model, SAMPLE_RATE)

    def callback(indata, frames, time, status):
        if status:
            print(f"⚠️ {status}")
        try:
            if rec.AcceptWaveform(indata):
                text = json.loads(rec.Result()).get("text", "")
            else:
                text = json.loads(rec.PartialResult()).get("partial", "")
            
            if text:
                # send safely to websocket
                asyncio.run_coroutine_threadsafe(websocket.send(text), loop)
        except Exception as e:
            print(f"Error in callback: {e}")

    try:
        with sd.RawInputStream(
            samplerate=SAMPLE_RATE,
            blocksize=BLOCKSIZE,
            dtype="int16",
            channels=1,
            callback=callback,
        ):
            print("🎤 Listening...")
            await websocket.wait_closed()  # keep running until client disconnects
    except Exception as e:
        print(f"Audio stream error: {e}")

async def main():
    async with websockets.serve(speech_server, "localhost", 8765):
        print("🟢 Vosk server running on ws://localhost:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
