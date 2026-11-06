import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  createMemberNumber,
  hashMemberPassword,
} from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const memberSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).default(""),
  password: z.string().min(8).max(200),
  initialBalance: z.number().int().min(0).max(100_000_000).default(0),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const members = await prisma.member.findMany({
    select: {
      id: true,
      memberNumber: true,
      username: true,
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
  return Response.json({ members });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = memberSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Ad, soyad ve en az 8 karakterli bir parola girin." },
      { status: 400 },
    );
  }

  const passwordHash = await hashMemberPassword(parsed.data.password);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const memberNumber = createMemberNumber().toString().padStart(8, "0");
    try {
      const member = await prisma.$transaction(async (transaction) => {
        const created = await transaction.member.create({
          data: {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            phone: parsed.data.phone || null,
            passwordHash,
            memberNumber,
            balance: parsed.data.initialBalance,
          },
          select: {
            id: true,
            memberNumber: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
            balance: true,
            isActive: true,
            createdAt: true,
          },
        });

        if (created.balance > 0) {
          await transaction.memberBalanceTransaction.create({
            data: {
              memberId: created.id,
              amount: created.balance,
              description: "Üye oluşturulurken başlangıç bakiyesi",
            },
          });
        }
        return created;
      });

      revalidatePath("/login/users");
      return Response.json({ member }, { status: 201 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  return Response.json(
    { error: "Üye numarası oluşturulamadı. Lütfen yeniden deneyin." },
    { status: 503 },
  );
}
