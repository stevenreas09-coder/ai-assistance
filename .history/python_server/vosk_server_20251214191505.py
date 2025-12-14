import json
import asyncio
import websockets
from vosk import Model, KaldiRecognizer

# ---------------- CONFIG ---------------- #
MODEL_PATH = "model/vosk-model-en-us-0.22-lgraph"
SAMPLE_RATE = 16000
# ---------------------------------------- #

# Load model (can be done once globally)
try:
    model = Model(MODEL_PATH)
except Exception as e:
    print(f"FATAL: Could not load Vosk model from {MODEL_PATH}. Error: {e}")
    exit(1)

# Function MUST accept (websocket, path)
async def speech_server(websocket, path): 
    print(f"Client connected from {websocket.remote_address}")
    rec = KaldiRecognizer(model, SAMPLE_RATE)

    try:
        # --- CRITICAL CHANGE: Listen for incoming messages (audio) ---
        async for message in websocket:
            
            # Vosk expects binary audio data (16-bit PCM)
            if isinstance(message, bytes):
                
                # Process audio chunk
                if rec.AcceptWaveform(message):
                    # Final result detected (user paused)
                    result = json.loads(rec.Result())
                    text = result.get("text", "")
                    if text:
                        print("Final:", text)
                        await websocket.send(json.dumps({
                            "type": "final",
                            "text": text
                        }))
                else:
                    # Partial result (user is still speaking)
                    result = json.loads(rec.PartialResult())
                    text = result.get("partial", "") # Vosk uses 'partial' key here
                    if text:
                        await websocket.send(json.dumps({
                            "type": "partial",
                            "text": text # Sending back with 'text' key for UI consistency
                        }))
            else:
                # Handle non-binary messages (if needed, e.g., control commands)
                print(f"Received non-audio message: {message}")

    except websockets.exceptions.ConnectionClosedOK:
        print(f"Client disconnected gracefully.")
    except Exception as e:
        print(f"Error during transcription: {e}")
    finally:
        # Clean up recognizer state if necessary
        pass

async def main():
    # --- CHANGE START ---
    # Simplifies the call to websockets.serve, reducing the chance of
    # argument resolution issues that cause the 'path' TypeError.
    # The arguments are now passed positionally as required: handler, host, port.
    server = await websockets.serve(
        speech_server, 
        "0.0.0.0", # host
        8765,      # port
        ping_interval=20, 
        ping_timeout=10
    )
    # --- CHANGE END ---
    
    print("Vosk server running on ws://0.0.0.0:8765")
    # --- Signal Electron that the server is ready ---
    print("SERVER_READY_SIGNAL:8765") 
    await server.wait_closed()  # wait for the server to close instead of asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())