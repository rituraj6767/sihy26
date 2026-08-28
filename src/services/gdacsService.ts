export interface GdacsGeometry {
  type: string;
  coordinates: any[];
}

export interface GdacsEvent {
  id: string;
  eventType: string;
  name: string;
  description: string;
  country: string;
  latitude: number;
  longitude: number;
  geometry?: GdacsGeometry;
  bbox?: number[];
}

export const GdacsService = {
  async fetchEventsNear(lat: number, lon: number, radiusKm: number = 300): Promise<GdacsEvent | null> {
    try {
      const url = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?country=India&fromdate=${new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;

      const data = await res.json();
      const features = data?.features || data?.events || [];
      if (!Array.isArray(features) || features.length === 0) return null;

      // Find feature closest to given lat/lon
      let closest: any = null;
      let minDistance = Infinity;

      for (const f of features) {
        const coords = f.geometry?.coordinates || [f.longitude, f.latitude];
        if (coords && coords.length >= 2) {
          const fLon = coords[0];
          const fLat = coords[1];
          const dist = Math.sqrt(Math.pow(fLat - lat, 2) + Math.pow(fLon - lon, 2)) * 111; // approx km
          if (dist < radiusKm && dist < minDistance) {
            minDistance = dist;
            closest = f;
          }
        }
      }

      if (!closest) return null;

      return {
        id: closest.properties?.eventid || closest.id || 'gdacs-event',
        eventType: closest.properties?.eventtype || 'Disaster',
        name: closest.properties?.name || closest.properties?.eventname || 'Hazard Zone',
        description: closest.properties?.description || '',
        country: 'India',
        latitude: closest.geometry?.coordinates?.[1] || lat,
        longitude: closest.geometry?.coordinates?.[0] || lon,
        geometry: closest.geometry,
        bbox: closest.bbox,
      };
    } catch {
      // Graceful fallback when network fails or API is unavailable
      return null;
    }
  },
};
