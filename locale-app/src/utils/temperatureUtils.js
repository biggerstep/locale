export function getTempColor(temp) {
  const normalized = Math.max(0, Math.min(1, (temp - 30) / 50));
  return `hsl(${(1 - normalized) * 240}, 70%, 50%)`;
}
