import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const requests = await prisma.memberBalanceRequest.findMany({
    select: {
      id: true,
      amount: true,
      status: true,
      reviewedBy: true,
      reviewedAt: true,
      reviewNote: true,
      createdAt: true,
      member: {
        select: {
          id: true,
          memberNumber: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          balance: true,
          isActive: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return Response.json({ requests });
}
