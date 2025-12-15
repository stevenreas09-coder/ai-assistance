// /public/audio-worklet/pcm-processor.js
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // mono
    const pcm16 = new Int16Array(channelData.length);

    for (let i = 0; i < channelData.length; i++) {
      let sample = channelData[i];
      sample = Math.max(-1, Math.min(1, sample));
      pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    // Transfer ownership (zero-copy)
    this.port.postMessage(pcm16.buffer, [pcm16.buffer]);

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
