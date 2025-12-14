import sounddevice as sd

try:
    devices = sd.query_devices()
    print("Available audio devices:")
    for i, dev in enumerate(devices):
        print(i, dev['name'], "(input)" if dev['max_input_channels'] > 0 else "")
    print("\nDefault input device:", sd.default.device)
except Exception as e:
    print("Error detecting audio devices:", e)
