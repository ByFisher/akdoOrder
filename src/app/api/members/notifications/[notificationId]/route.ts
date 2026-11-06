import { z } from "zod";
import { getCurrentMember } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  read: z.literal(true),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  const member = await getCurrentMember();
  if (!member) {
    return Response.json({ error: "Üye girişi gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Bildirim bilgisi geçersiz." }, { status: 400 });
  }

  const { notificationId } = await params;
  const result = await prisma.memberNotification.updateMany({
    where: { id: notificationId, memberId: member.id, readAt: null },
    data: { readAt: new Date() },
  });
  if (result.count === 0) {
    const notification = await prisma.memberNotification.findFirst({
      where: { id: notificationId, memberId: member.id },
      select: { id: true },
    });
    if (!notification) {
      return Response.json({ error: "Bildirim bulunamadı." }, { status: 404 });
    }
  }

  return Response.json({ ok: true });
}
