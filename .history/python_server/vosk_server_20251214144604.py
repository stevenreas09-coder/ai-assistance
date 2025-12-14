import json
import asyncio
import sounddevice as sd
import websockets
from vosk import Model, KaldiRecognizer

MODEL_PATH = "vosk-model-en-us-0.22-lgraph"
SAMPLE_RATE = 16000

model = Model(MODEL_PATH)
rec = KaldiRecognizer(model, SAMPLE_RATE)

async def speech_server(websocket):
    loop = asyncio.get_event_loop()

    def callback(indata, frames, time, status):
        if rec.AcceptWaveform(indata):
            text = json.loads(rec.Result()).get("text", "")
            if text:
                asyncio.run_coroutine_threadsafe(
                    websocket.send(text), loop
                )

    with sd.RawInputStream(
        samplerate=SAMPLE_RATE,
        blocksize=8000,
        dtype="int16",
        channels=1,
        callback=callback,
    ):
        await asyncio.Future()  # run forever

async def main():
    async with websockets.serve(speech_server, "localhost", 8765):
        print("🎤 Vosk server running on ws://localhost:8765")
        await asyncio.Future()

asyncio.run(main())
