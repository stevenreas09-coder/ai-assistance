import sys
import whisper

# Load model once for efficiency
model = whisper.load_model("small")

# Get audio chunk path
audio_path = sys.argv[1]

# Transcribe the chunk
result = model.transcribe(audio_path, language="en")
print(result["text"])
