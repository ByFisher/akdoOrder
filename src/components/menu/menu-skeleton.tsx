import Image from "next/image";
import { ArrowRight } from "lucide-react";
import qrLogo from "../../../img/logo/akdoqr.png";
import { Skeleton } from "@/components/ui/skeleton";

export function MenuSkeleton() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1320px] bg-[#f7f3eb] px-5 pb-20 sm:px-8">
      <header className="flex h-[84px] items-center justify-between border-b border-[#e8dfd3]">
        <Image
          alt="Akdo QR"
          className="h-11 w-[58px] object-contain"
          priority
          src={qrLogo}
        />
        <ArrowRight className="text-[#624c3e]" size={20} />
      </header>
      <Skeleton className="mt-7 h-[390px] rounded-[22px] bg-[#e8ddcd]" />
      <div className="mt-10 flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="hidden h-12 w-72 rounded-full sm:block" />
      </div>
      <div className="mt-7 flex gap-3">
        {[88, 98, 96, 116, 100].map((width) => (
          <Skeleton key={width} className="h-10 rounded-full" style={{ width }} />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-[4px] border border-[#e8dfd3] bg-[#fcfaf5] p-3">
            <Skeleton className="h-52 rounded-[18px]" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-5 h-10 w-full rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
