import locations from "@/lib/turkey-locations.json";

export const turkeyLocations = locations;

export function isValidTurkeyLocation(city: string, district: string) {
  const province = turkeyLocations.find((location) => location.city === city);
  return province?.districts.includes(district) ?? false;
}
