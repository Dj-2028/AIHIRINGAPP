export function calculateHybridScore(
  adjacencyScore: number,
  velocityScore: number
): number {
  return Math.round(adjacencyScore * 0.4 + velocityScore * 0.6);
}
