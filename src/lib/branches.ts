import { prisma } from "@/lib/prisma";

export const DEFAULT_BRANCH_ID = "default-branch";

export async function ensureDefaultBranch() {
  const branch = await prisma.branch.upsert({
    where: { id: DEFAULT_BRANCH_ID },
    create: {
      id: DEFAULT_BRANCH_ID,
      name: "Kahramanmaraş Merkez",
      slug: "kahramanmaras-merkez",
      city: "Kahramanmaraş",
      isDefault: true,
    },
    update: { isDefault: true },
  });

  if (!branch.city) {
    return prisma.branch.update({
      where: { id: branch.id },
      data: { city: "Kahramanmaraş" },
    });
  }

  return branch;
}

export async function getAdminBranches() {
  await ensureDefaultBranch();

  return prisma.branch.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function getPublicBranches() {
  const defaultBranch = await ensureDefaultBranch();

  return prisma.branch.findMany({
    where: {
      isActive: true,
      OR: [{ isDefault: true }, { id: { not: defaultBranch.id } }],
    },
    select: {
      id: true,
      name: true,
      city: true,
      district: true,
      address: true,
    },
    orderBy: [{ isDefault: "desc" }, { city: "asc" }, { name: "asc" }],
  });
}

export async function getActiveBranch(branchId?: string | null) {
  const defaultBranch = await ensureDefaultBranch();

  if (!branchId) {
    return defaultBranch;
  }

  return prisma.branch.findFirst({
    where: { id: branchId, isActive: true },
  });
}
