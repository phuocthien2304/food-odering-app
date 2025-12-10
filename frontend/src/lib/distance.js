// Haversine formula to calculate distance in km between two coordinates
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // round to 1 decimal
}

// Calculate delivery fee: 5000 VND per km
export function calculateDeliveryFee(distance) {
  return Math.round(distance * 5000);
}

// Calculate estimated delivery time: 5 minutes per km
export function calculateDeliveryTime(distance) {
  return Math.round(distance * 5); // minutes
}
