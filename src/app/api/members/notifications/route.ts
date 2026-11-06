import { getCurrentMember } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return Response.json({ error: "Üye girişi gerekli." }, { status: 401 });
  }

  const [notifications, unreadCount] = await prisma.$transaction([
    prisma.memberNotification.findMany({
      where: { memberId: member.id },
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        readAt: true,
        orderId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.memberNotification.count({
      where: { memberId: member.id, readAt: null },
    }),
  ]);

  return Response.json({ notifications, unreadCount });
}
