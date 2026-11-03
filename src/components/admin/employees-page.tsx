import Link from "next/link";
import { ChefHat, Users, Utensils } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StaffAccountsManagement } from "@/components/admin/staff-accounts-management";
import type { AdminBranch } from "@/lib/branch-types";

interface StaffAccount {
  id: string;
  username: string;
  role: "chef" | "waiter";
  isActive: boolean;
  createdAt: string;
}

export function EmployeesPage({
  activeBranch,
  branches,
  employees,
}: {
  activeBranch: AdminBranch;
  branches: AdminBranch[];
  employees: StaffAccount[];
}) {
  return (
    <AdminLayout
      activeBranchId={activeBranch.id}
      activePath="/login/employees"
      branches={branches}
    >
      <section className="mb-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#96743c]">
          <Users size={14} />
          EKİP
        </div>
        <h1 className="font-editorial mt-2 text-4xl tracking-tight text-[#203d31]">
          Çalışanlar
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#737a70]">
          Personel hesabı oluşturun ve AkdoŞef veya AkdoGarson erişimini yönetin.
        </p>
      </section>
      <section className="mb-5 grid gap-4 sm:grid-cols-2">
        <Link
          className="rounded-[22px] border border-[#e3dfd4] bg-[#fffefa] p-6 transition hover:border-[#bd9856]"
          href="/akdosef"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-[#e9eee7] text-[#31513e]">
            <ChefHat size={21} />
          </span>
          <h2 className="font-editorial mt-4 text-xl text-[#203d31]">AkdoŞef</h2>
          <p className="mt-2 text-sm leading-6 text-[#737a70]">
            Gelen siparişleri görüntüleyin, hazırlamaya alın ve hazır durumuna
            geçirin.
          </p>
        </Link>
        <Link
          className="rounded-[22px] border border-[#e3dfd4] bg-[#fffefa] p-6 transition hover:border-[#bd9856]"
          href="/akdogarson"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-[#f3eddd] text-[#96743c]">
            <Utensils size={21} />
          </span>
          <h2 className="font-editorial mt-4 text-xl text-[#203d31]">AkdoGarson</h2>
          <p className="mt-2 text-sm leading-6 text-[#737a70]">
            Şefin hazırladığı siparişleri görün ve masaya teslim edildi olarak
            işaretleyin.
          </p>
        </Link>
      </section>
      <StaffAccountsManagement employees={employees} />
    </AdminLayout>
  );
}
