// /public/audio-worklet/pcm-processor.js
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0]; // mono channel
    const buffer = new ArrayBuffer(channelData.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < channelData.length; i++) {
      let sample = Math.max(-1, Math.min(1, channelData[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(i * 2, sample, true); // little-endian
    }

    this.port.postMessage(buffer); // send PCM to main thread
    return true; // keep processor alive
  }
}

registerProcessor("pcm-processor", PCMProcessor);
