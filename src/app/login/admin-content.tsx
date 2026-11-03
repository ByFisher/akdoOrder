import { connection } from "next/server";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminPanel } from "@/components/admin/admin-panel";
import { BranchesPage } from "@/components/admin/branches-page";
import { CategoriesPage } from "@/components/admin/categories-page";
import { CashRegisterPage } from "@/components/admin/cash-register-page";
import { EmployeesPage } from "@/components/admin/employees-page";
import { FinancialLedgerPage } from "@/components/admin/financial-ledger-page";
import { MenuPage } from "@/components/admin/menu-page";
import { MembersPage } from "@/components/admin/members-page";
import { TableManagementPage } from "@/components/admin/table-management-page";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getActiveBranch, getAdminBranches } from "@/lib/branches";
import { prisma } from "@/lib/prisma";

function getCashSummaryWindow() {
  const collectedUntil = new Date();
  return {
    collectedSince: new Date(collectedUntil.getTime() - 24 * 60 * 60 * 1000),
    collectedUntil,
  };
}

export type AdminSection =
  | "overview"
  | "branches"
  | "categories"
  | "menu"
  | "tables"
  | "users"
  | "employees"
  | "cash"
  | "ledger";

export async function AdminContent({
  redirectTo = "/login",
  section = "overview",
  requestedBranchId,
}: {
  redirectTo?: string;
  section?: AdminSection;
  requestedBranchId?: string;
}) {
  await connection();

  if (!(await isAdminAuthenticated())) {
    return (
      <AdminLogin
        configured={isAdminConfigured()}
        redirectTo={redirectTo}
      />
    );
  }

  const branches = await getAdminBranches();
  const branch = await getActiveBranch(requestedBranchId);
  const activeBranch = branch ?? branches.find((item) => item.isDefault)!;
  const adminBranches = branches.map(
    ({ id, name, slug, city, district, address, isActive, isDefault }) => ({
      id,
      name,
      slug,
      city,
      district,
      address,
      isActive,
      isDefault,
    }),
  );

  if (section === "branches") {
    return (
      <BranchesPage
        activeBranchId={activeBranch.id}
        branches={adminBranches}
      />
    );
  }

  if (section === "tables") {
    const tables = await prisma.diningTable.findMany({
      where: { branchId: activeBranch.id },
      orderBy: { name: "asc" },
    });
    return (
      <TableManagementPage
        activeBranch={activeBranch}
        branches={adminBranches}
        tables={tables}
      />
    );
  }

  if (section === "users") {
    const members = await prisma.member.findMany({
      select: {
        id: true,
        memberNumber: true,
        firstName: true,
        lastName: true,
        phone: true,
        balance: true,
        isActive: true,
        createdAt: true,
        transactions: {
          select: {
            id: true,
            amount: true,
            description: true,
            createdAt: true,
            orderId: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    });
    return (
      <MembersPage
        activeBranch={activeBranch}
        branches={adminBranches}
        members={members.map((member) => ({
          ...member,
          createdAt: member.createdAt.toISOString(),
          transactions: member.transactions.map((transaction) => ({
            ...transaction,
            createdAt: transaction.createdAt.toISOString(),
          })),
        }))}
      />
    );
  }

  if (section === "cash") {
    const { collectedSince, collectedUntil } = getCashSummaryWindow();
    const [orders, pendingRequests, collectedSummary] = await Promise.all([
      prisma.diningOrder.findMany({
        where: { branchId: activeBranch.id },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          paymentStatus: true,
          paymentMethod: true,
          paidAt: true,
          paidBy: true,
          table: { select: { name: true } },
          branch: { select: { name: true } },
          member: {
            select: {
              firstName: true,
              lastName: true,
              memberNumber: true,
            },
          },
          items: {
            select: { id: true, name: true, price: true, quantity: true },
            orderBy: { id: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.memberBalanceRequest.findMany({
        where: { status: "PENDING" },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          member: {
            select: {
              firstName: true,
              lastName: true,
              memberNumber: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
      prisma.diningOrder.aggregate({
        where: {
          branchId: activeBranch.id,
          paymentStatus: "PAID",
          paidAt: { gte: collectedSince, lte: collectedUntil },
        },
        _sum: { total: true },
        _count: { id: true },
      }),
    ]);

    return (
      <CashRegisterPage
        activeBranch={activeBranch}
        branches={adminBranches}
        orders={orders.map((order) => ({
          ...order,
          createdAt: order.createdAt.toISOString(),
          paidAt: order.paidAt?.toISOString() ?? null,
        }))}
        pendingRequests={pendingRequests.map((request) => ({
          ...request,
          createdAt: request.createdAt.toISOString(),
        }))}
        collectedLastDay={collectedSummary._sum.total ?? 0}
        collectedOrderCount={collectedSummary._count.id}
      />
    );
  }

  if (section === "ledger") {
    return <FinancialLedgerPage />;
  }

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { branchId: activeBranch.id },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      where: { category: { branchId: activeBranch.id } },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        allergens: true,
        stock: true,
        isActive: true,
        featured: true,
        category: { select: { id: true, name: true, isActive: true } },
      },
    }),
  ]);

  const menuCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    isActive: category.isActive,
    productCount: category._count.products,
  }));

  switch (section) {
    case "categories":
      return (
        <CategoriesPage
          activeBranch={activeBranch}
          branches={adminBranches}
          categories={menuCategories}
        />
      );
    case "menu":
      return (
        <MenuPage
          activeBranch={activeBranch}
          branches={adminBranches}
          categories={menuCategories}
          products={products}
        />
      );
    case "employees":
      const employees = await prisma.staffAccount.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: [{ role: "asc" }, { username: "asc" }],
      });
      return (
        <EmployeesPage
          activeBranch={activeBranch}
          branches={adminBranches}
          employees={employees.map((employee) => ({
            ...employee,
            role: employee.role === "waiter" ? "waiter" : "chef",
            createdAt: employee.createdAt.toISOString(),
          }))}
        />
      );
    case "overview":
      return (
        <AdminPanel
          activeBranch={activeBranch}
          branches={adminBranches}
          categoryCount={categories.length}
          productCount={products.length}
          visibleCount={
            products.filter(
              (product) => product.isActive && product.category.isActive,
            ).length
          }
          outOfStockCount={
            products.filter((product) => product.stock === 0).length
          }
        />
      );
  }
}
