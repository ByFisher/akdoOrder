import { Suspense } from "react";
import { MenuContent } from "@/app/menu-content";
import { MenuSkeleton } from "@/components/menu/menu-skeleton";

export default function Home(props: PageProps<"/">) {
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <MenuContent searchParams={props.searchParams} />
    </Suspense>
  );
}
