const STEP_MAX = 8;
const NETWORK_STEP_MAX = 200;
const SPIKE_PROBABILITY = 0.12;
const SPIKE_CPU_MIN = 91;

export interface MetricSnapshot {
  cpu_percent: number;
  ram_percent: number;
  disk_percent: number;
  network_in_kbps: number;
  network_out_kbps: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function softStep(current: number, stepMax: number, max: number): number {
  const delta = (Math.random() * 2 - 1) * stepMax;
  return clamp(current + delta, 0, max);
}

export function generateNextMetric(previous: MetricSnapshot): MetricSnapshot {
  let cpu = softStep(previous.cpu_percent, STEP_MAX, 100);
  const ram = softStep(previous.ram_percent, STEP_MAX, 100);
  const disk = softStep(previous.disk_percent, STEP_MAX / 2, 100);
  const netIn = softStep(previous.network_in_kbps, NETWORK_STEP_MAX, 10_000);
  const netOut = softStep(previous.network_out_kbps, NETWORK_STEP_MAX, 10_000);

  if (Math.random() < SPIKE_PROBABILITY) {
    cpu = clamp(SPIKE_CPU_MIN + Math.random() * (100 - SPIKE_CPU_MIN), SPIKE_CPU_MIN, 100);
  }

  return {
    cpu_percent: cpu,
    ram_percent: ram,
    disk_percent: disk,
    network_in_kbps: netIn,
    network_out_kbps: netOut,
  };
}

export function generateInitialMetric(): MetricSnapshot {
  return {
    cpu_percent: clamp(20 + Math.random() * 40, 0, 100),
    ram_percent: clamp(30 + Math.random() * 40, 0, 100),
    disk_percent: clamp(10 + Math.random() * 30, 0, 100),
    network_in_kbps: clamp(100 + Math.random() * 900, 0, 10_000),
    network_out_kbps: clamp(50 + Math.random() * 450, 0, 10_000),
  };
}
