import { Suspense } from "react";
import { connection } from "next/server";
import { OrderTracking } from "@/components/orders/order-tracking";

export default function OrderTrackingPage({
  params,
}: PageProps<"/siparis-takip/[trackingToken]">) {
  return (
    <Suspense fallback={null}>
      <OrderTrackingContent params={params} />
    </Suspense>
  );
}

async function OrderTrackingContent({
  params,
}: {
  params: PageProps<"/siparis-takip/[trackingToken]">["params"];
}) {
  await connection();
  const { trackingToken } = await params;
  return <OrderTracking trackingToken={trackingToken} />;
}
