import { turkeyLocations } from "@/lib/turkey-locations";

export async function GET() {
  return Response.json({ locations: turkeyLocations });
}
