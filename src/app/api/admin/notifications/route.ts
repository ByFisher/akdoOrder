import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const notificationSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(500),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = notificationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Başlık (en fazla 80) ve mesaj (en fazla 500 karakter) girin." },
      { status: 400 },
    );
  }

  const members = await prisma.member.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  if (members.length === 0) {
    return Response.json(
      { error: "Bildirim gönderilecek aktif üye bulunamadı." },
      { status: 409 },
    );
  }

  const result = await prisma.memberNotification.createMany({
    data: members.map(({ id }) => ({
      memberId: id,
      title: parsed.data.title,
      body: parsed.data.body,
      type: "ANNOUNCEMENT",
    })),
  });

  return Response.json({ ok: true, sentCount: result.count }, { status: 201 });
}
