export interface RouteMetrics {
  durationMinutes: number;
  durationInTrafficMinutes: number;
  distanceKm: number;
  trafficDelayMinutes: number;
}

export interface RouteComparison {
  originalDurationMinutes: number;
  alternativeDurationMinutes: number;
  timeSavedMinutes: number;
  originalDistanceKm: number;
  alternativeDistanceKm: number;
  distanceDiffKm: number;
  originalDelayMinutes: number;
  alternativeDelayMinutes: number;
  recommendation: "keep_original" | "take_alternative" | "minor_improvement";
  reasoning: string;
}

export function compareRoutes(
  original: RouteMetrics,
  alternative: RouteMetrics
): RouteComparison {
  const timeSaved =
    original.durationInTrafficMinutes - alternative.durationInTrafficMinutes;
  const distanceDiff = alternative.distanceKm - original.distanceKm;

  let recommendation: RouteComparison["recommendation"];
  let reasoning: string;

  if (timeSaved >= 10) {
    recommendation = "take_alternative";
    reasoning = `Alternative saves ${timeSaved} minutes despite being ${Math.abs(distanceDiff).toFixed(1)} km ${distanceDiff > 0 ? "longer" : "shorter"}.`;
  } else if (timeSaved >= 3) {
    recommendation = "minor_improvement";
    reasoning = `Alternative saves ${timeSaved} minutes. Marginal improvement — consider staying on original route.`;
  } else {
    recommendation = "keep_original";
    reasoning =
      timeSaved <= 0
        ? "Original route is faster or equal. No benefit from re-routing."
        : `Alternative only saves ${timeSaved} minutes. Not worth the detour.`;
  }

  return {
    originalDurationMinutes: original.durationInTrafficMinutes,
    alternativeDurationMinutes: alternative.durationInTrafficMinutes,
    timeSavedMinutes: timeSaved,
    originalDistanceKm: original.distanceKm,
    alternativeDistanceKm: alternative.distanceKm,
    distanceDiffKm: distanceDiff,
    originalDelayMinutes: original.trafficDelayMinutes,
    alternativeDelayMinutes: alternative.trafficDelayMinutes,
    recommendation,
    reasoning,
  };
}
