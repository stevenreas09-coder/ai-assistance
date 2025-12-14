import json
import asyncio
import sounddevice as sd
import websockets
from vosk import Model, KaldiRecognizer

# ---------------- CONFIG ---------------- #
MODEL_PATH = "model/vosk-model-en-us-0.22-lgraph"
SAMPLE_RATE = 16000
BLOCKSIZE = 8000  # increase blocksize to reduce input overflow
CHANNELS = 1
# ---------------------------------------- #

# Load model
model = Model(MODEL_PATH)

async def speech_server(websocket):
    loop = asyncio.get_event_loop()
    rec = KaldiRecognizer(model, SAMPLE_RATE)
    print("Client connected")

    def callback(indata, frames, time, status):
        if status:
            print(f"⚠️ {status}")  # warn only
        try:
            data_bytes = indata.tobytes() if hasattr(indata, "tobytes") else bytes(indata)

            if rec.AcceptWaveform(data_bytes):
                # Final result
                result = json.loads(rec.Result())
                text = result.get("text", "")
                if text:
                    print("Final:", text)
                    asyncio.run_coroutine_threadsafe(websocket.send(json.dumps({
                        "type": "final",
                        "text": text
                    })), loop)
            else:
                # Partial result
                result = json.loads(rec.PartialResult())
                text = result.get("partial", "")
                if text and len(text) > 0:
                    asyncio.run_coroutine_threadsafe(websocket.send(json.dumps({
                        "type": "partial",
                        "text": text
                    })), loop)
        except Exception as e:
            print(f"Callback error: {e}")

    try:
        with sd.RawInputStream(
            samplerate=SAMPLE_RATE,
            blocksize=BLOCKSIZE,
            dtype="int16",
            channels=CHANNELS,
            callback=callback,
        ):
            print("🎤 Listening...")
            await websocket.wait_closed()  # keep connection alive

    except Exception as e:
        print(f"Audio stream error: {e}")

async def main():
    async with websockets.serve(speech_server, "localhost", 8765):
        print("Vosk server running on ws://localhost:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
