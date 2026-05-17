// Haversine formula to calculate distance in km
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Smart Suggestion Logic
export function getSmartSuggestions(
  userLat: number,
  userLng: number,
  userElevation: number,
  instruments: Array<{
    id: string;
    lngLat: [number, number];
    elevation?: number;
    [key: string]: any;
  }> = []
) {
  return instruments
    .map((pos) => {
      const distance = getDistance(userLat, userLng, pos.lngLat[1], pos.lngLat[0]);
      const elevationDiff = (pos.elevation || 0) - userElevation;
      const elevationBonus = elevationDiff > 0 ? Math.min(elevationDiff / 50, 5) : 0;
      const score = distance - elevationBonus;
      return { ...pos, score, distance };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
}
