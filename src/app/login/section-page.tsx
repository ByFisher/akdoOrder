import { Suspense } from "react";
import {
  AdminContent,
  type AdminSection,
} from "@/app/login/admin-content";

export function AdminLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f5f0]">
      <div className="size-9 animate-spin rounded-full border-2 border-[#eadfc9] border-t-[#a67a36]" />
    </main>
  );
}

export function LoginSectionPage({
  path,
  section,
  requestedBranchId,
}: {
  path: string;
  section: Exclude<AdminSection, "overview">;
  requestedBranchId?: string;
}) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminContent
        redirectTo={
          requestedBranchId
            ? `${path}?branchId=${encodeURIComponent(requestedBranchId)}`
            : path
        }
        requestedBranchId={requestedBranchId}
        section={section}
      />
    </Suspense>
  );
}
