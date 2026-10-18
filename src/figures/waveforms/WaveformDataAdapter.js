export default class WaveformDataAdapter {
  static collections(payload) {
    return [
      payload?.waveforms,
      payload?.data?.waveforms,
      payload?.data?.arr,
      payload?.arr,
      payload?.traces,
      payload?.data?.traces,
    ].filter(Array.isArray);
  }

  static samples(waveform) {
    const samples = waveform?.samples ?? waveform?.trace ?? waveform?.adc ?? waveform?.values;
    return Array.isArray(samples) ? samples.map(Number).filter(Number.isFinite) : null;
  }

  static times(waveform) {
    const times = waveform?.['times-ns'] ?? waveform?.times;
    if (!Array.isArray(times)) return null;
    const numeric = times.map(Number);
    return numeric.length === this.samples(waveform)?.length && numeric.every(Number.isFinite)
      ? numeric
      : null;
  }

  static channel(waveform) {
    return Number(waveform?.channel ?? waveform?.channelTag ?? waveform?.channel_id ?? waveform?.pixel ?? 0);
  }

  static module(waveform) {
    return Number(waveform?.module ?? waveform?.module_id ?? waveform?.crateNum ?? 0);
  }

  static submodule(waveform) {
    return Number(waveform?.submodule ?? waveform?.submodule_id ?? waveform?.amcNum ?? waveform?.slot ?? 0);
  }

  static detector(waveform, payload) {
    return String(waveform?.detector ?? payload?.detector ?? '').toLowerCase();
  }

  static find(payload, { detector, channel, module, submodule = 0 }) {
    const detectorName = detector.toLowerCase();
    for (const collection of this.collections(payload)) {
      const waveform = collection.find((candidate) => {
        const candidateDetector = this.detector(candidate, payload);
        return this.samples(candidate)
          && this.channel(candidate) === channel
          && this.module(candidate) === module
          && this.submodule(candidate) === submodule
          && (!candidateDetector || candidateDetector === detectorName);
      });
      if (waveform) return waveform;
    }
    return null;
  }
}
