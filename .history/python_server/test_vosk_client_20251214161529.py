# test_vosk_client.py
import asyncio
import websockets

async def test_client():
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        print("Connected to Vosk server")
        try:
            while True:
                msg = await websocket.recv()
                print("Transcript:", msg)
        except websockets.ConnectionClosed:
            print("Connection closed")

if __name__ == "__main__":
    asyncio.run(test_client())
