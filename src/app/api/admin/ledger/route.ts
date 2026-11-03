import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(["ALL", "ORDERS", "BALANCE"]).default("ALL"),
  search: z.string().trim().max(100).default(""),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().max(512).optional(),
});

const cursorSchema = z.object({
  at: z.string().datetime(),
  key: z.string().regex(/^(order|balance):.+$/),
});

function parseDate(value: string | undefined, end = false) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return undefined;
  }
  const date = new Date(`${value}T00:00:00.000+03:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (end) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function buildTimeFilter(
  from: Date | undefined,
  to: Date | undefined,
  cursor: z.infer<typeof cursorSchema> | undefined,
  source: "order" | "balance",
) {
  const conditions: Array<Record<string, unknown>> = [];
  if (from) conditions.push({ gte: from });
  if (to) conditions.push({ lt: to });
  const dateFilter =
    conditions.length === 0
      ? undefined
      : Object.assign({}, ...conditions);
  const cursorId = cursor?.key.startsWith(`${source}:`)
    ? cursor.key.slice(source.length + 1)
    : undefined;
  const field = source === "order" ? "paidAt" : "createdAt";
  const filters: Array<Record<string, unknown>> = [];
  if (dateFilter) filters.push({ [field]: dateFilter });
  if (cursor) {
    const equalTimestampFilter =
      source === "balance" && cursor.key.startsWith("order:")
        ? { [field]: { equals: new Date(cursor.at) } }
        : cursorId
          ? {
              [field]: { equals: new Date(cursor.at) },
              id: { lt: cursorId },
            }
          : undefined;
    filters.push({
      OR: [
        { [field]: { lt: new Date(cursor.at) } },
        ...(equalTimestampFilter ? [equalTimestampFilter] : []),
      ],
    });
  }

  return filters.length > 0 ? { AND: filters } : {};
}

function buildSearch(search: string) {
  if (!search) return {};
  return {
    OR: [
      { id: { contains: search } },
      { paidBy: { contains: search } },
      { table: { name: { contains: search } } },
      { branch: { name: { contains: search } } },
      {
        member: {
          is: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { memberNumber: { contains: search } },
            ],
          },
        },
      },
      { items: { some: { name: { contains: search } } } },
    ],
  };
}

function buildBalanceSearch(search: string) {
  if (!search) return {};
  return {
    OR: [
      { id: { contains: search } },
      { description: { contains: search } },
      {
        member: {
          is: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { memberNumber: { contains: search } },
            ],
          },
        },
      },
      { balanceRequest: { is: { reviewedBy: { contains: search } } } },
    ],
  };
}

function encodeCursor(entry: { at: Date; key: string }) {
  return Buffer.from(
    JSON.stringify({ at: entry.at.toISOString(), key: entry.key }),
  )
    .toString("base64url");
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    type: url.searchParams.get("type") ?? "ALL",
    search: url.searchParams.get("search") ?? "",
    limit: url.searchParams.get("limit") ?? 50,
    cursor: url.searchParams.get("cursor") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "Defter filtrelerini kontrol edin." }, { status: 400 });
  }

  const filters = parsed.data;
  const from = parseDate(filters.from);
  const to = parseDate(filters.to, true);
  if ((filters.from && !from) || (filters.to && !to) || (from && to && from >= to)) {
    return Response.json({ error: "Geçerli bir tarih aralığı seçin." }, { status: 400 });
  }

  let cursor: z.infer<typeof cursorSchema> | undefined;
  if (filters.cursor) {
    try {
      const decoded: unknown = JSON.parse(
        Buffer.from(filters.cursor, "base64url").toString("utf8"),
      );
      const parsedCursor = cursorSchema.safeParse(decoded);
      if (!parsedCursor.success) throw new Error("Invalid cursor");
      cursor = parsedCursor.data;
    } catch {
      return Response.json({ error: "Defter sayfalama bilgisi geçersiz." }, { status: 400 });
    }
  }

  const orderWhere = {
    paymentStatus: "PAID",
    paidAt: { not: null },
    ...buildTimeFilter(from, to, cursor, "order"),
    ...buildSearch(filters.search),
  };
  const balanceWhere = {
    orderId: null,
    ...buildTimeFilter(from, to, cursor, "balance"),
    ...buildBalanceSearch(filters.search),
  };
  const summaryOrderWhere = {
    paymentStatus: "PAID",
    paidAt: { not: null },
    ...buildTimeFilter(from, to, undefined, "order"),
    ...buildSearch(filters.search),
  };
  const summaryBalanceWhere = {
    orderId: null,
    ...buildTimeFilter(from, to, undefined, "balance"),
    ...buildBalanceSearch(filters.search),
  };
  const includeOrders = filters.type !== "BALANCE";
  const includeBalance = filters.type !== "ORDERS";

  const [orders, balanceTransactions, cashOrderSummary, walletOrderSummary, topupSummary, adjustmentSummary] =
    await Promise.all([
      includeOrders
        ? prisma.diningOrder.findMany({
            where: orderWhere,
            select: {
              id: true,
              status: true,
              total: true,
              paymentMethod: true,
              paidAt: true,
              paidBy: true,
              branch: { select: { name: true } },
              table: { select: { name: true } },
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
            orderBy: [{ paidAt: "desc" }, { id: "desc" }],
            take: filters.limit + 1,
          })
        : Promise.resolve([]),
      includeBalance
        ? prisma.memberBalanceTransaction.findMany({
            where: balanceWhere,
            select: {
              id: true,
              balanceRequestId: true,
              amount: true,
              description: true,
              createdAt: true,
              balanceRequest: {
                select: {
                  id: true,
                  status: true,
                  reviewedBy: true,
                  reviewedAt: true,
                  reviewNote: true,
                },
              },
              member: {
                select: {
                  firstName: true,
                  lastName: true,
                  memberNumber: true,
                },
              },
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: filters.limit + 1,
          })
        : Promise.resolve([]),
      includeOrders
        ? prisma.diningOrder.aggregate({
            where: {
              ...summaryOrderWhere,
              paymentMethod: { in: ["CASH", "EXTERNAL_POS"] },
            },
            _sum: { total: true },
            _count: { id: true },
          })
        : Promise.resolve({ _sum: { total: null }, _count: { id: 0 } }),
      includeOrders
        ? prisma.diningOrder.aggregate({
            where: { ...summaryOrderWhere, paymentMethod: "MEMBER_BALANCE" },
            _sum: { total: true },
            _count: { id: true },
          })
        : Promise.resolve({ _sum: { total: null }, _count: { id: 0 } }),
      includeBalance
        ? prisma.memberBalanceTransaction.aggregate({
            where: {
              ...summaryBalanceWhere,
              balanceRequestId: { not: null },
              amount: { gt: 0 },
            },
            _sum: { amount: true },
            _count: { id: true },
          })
        : Promise.resolve({ _sum: { amount: null }, _count: { id: 0 } }),
      includeBalance
        ? prisma.memberBalanceTransaction.aggregate({
            where: {
              ...summaryBalanceWhere,
              balanceRequestId: null,
              amount: { not: 0 },
            },
            _sum: { amount: true },
            _count: { id: true },
          })
        : Promise.resolve({ _sum: { amount: null }, _count: { id: 0 } }),
    ]);

  const entries = [
    ...orders.map((order) => ({
      id: `order:${order.id}`,
      kind: "ORDER_PAYMENT" as const,
      at: order.paidAt!.toISOString(),
      amount: order.total,
      cashChange:
        order.paymentMethod === "CASH" || order.paymentMethod === "EXTERNAL_POS"
          ? order.total
          : 0,
      balanceChange:
        order.paymentMethod === "MEMBER_BALANCE" ? -order.total : 0,
      paymentMethod: order.paymentMethod,
      description: `Masa siparişi · ${order.table.name}`,
      orderId: order.id,
      branchName: order.branch.name,
      tableName: order.table.name,
      member: order.member,
      performedBy: order.paidBy,
      status: order.status,
      items: order.items,
      reviewNote: null,
    })),
    ...balanceTransactions.map((transaction) => {
      const isTopup = transaction.balanceRequestId !== null;
      return {
        id: `balance:${transaction.id}`,
        kind: isTopup
          ? ("BALANCE_TOPUP" as const)
          : ("BALANCE_ADJUSTMENT" as const),
        at: transaction.createdAt.toISOString(),
        amount: Math.abs(transaction.amount),
        cashChange: isTopup && transaction.amount > 0 ? transaction.amount : 0,
        balanceChange: transaction.amount,
        paymentMethod: isTopup ? "CASH" : null,
        description: transaction.description,
        orderId: null,
        branchName: null,
        tableName: null,
        member: transaction.member,
        performedBy: transaction.balanceRequest?.reviewedBy ?? null,
        status: transaction.balanceRequest?.status ?? "COMPLETED",
        items: [],
        reviewNote: transaction.balanceRequest?.reviewNote ?? null,
      };
    }),
  ].sort((a, b) => {
    const timeDifference = new Date(b.at).getTime() - new Date(a.at).getTime();
    return timeDifference || b.id.localeCompare(a.id);
  });

  const hasMore = entries.length > filters.limit;
  const pageEntries = entries.slice(0, filters.limit);
  const lastEntry = pageEntries.at(-1);
  const nextCursor = hasMore && lastEntry
    ? encodeCursor({ at: new Date(lastEntry.at), key: lastEntry.id })
    : null;

  return Response.json({
    entries: pageEntries,
    nextCursor,
    summary: {
      cashReceived:
        (cashOrderSummary._sum.total ?? 0) +
        (topupSummary._sum.amount ?? 0),
      cashOrderCount: cashOrderSummary._count.id,
      topupCount: topupSummary._count.id,
      memberBalanceSales: walletOrderSummary._sum.total ?? 0,
      memberBalanceSaleCount: walletOrderSummary._count.id,
      balanceAdjustments: adjustmentSummary._sum.amount ?? 0,
      adjustmentCount: adjustmentSummary._count.id,
    },
  });
}
