import { connection } from "next/server";
import { OrderTracking } from "@/components/orders/order-tracking";

export default async function OrderTrackingPage({
  params,
}: PageProps<"/siparis-takip/[trackingToken]">) {
  await connection();
  const { trackingToken } = await params;
  return <OrderTracking trackingToken={trackingToken} />;
}
