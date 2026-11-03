import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createMenuAdminTools } from "@/lib/ai-tools";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getActiveBranch } from "@/lib/branches";
import { prisma } from "@/lib/prisma";

const chatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(30),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const branch = await getActiveBranch(
    new URL(request.url).searchParams.get("branchId"),
  );
  if (!branch) {
    return Response.json({ error: "Seçilen şube bulunamadı veya pasif." }, { status: 404 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "AI sohbetini kullanmak için OPENAI_API_KEY tanımlayın." },
      { status: 503 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Sohbet mesajları geçerli değil." },
      { status: 400 },
    );
  }

  const tools = createMenuAdminTools(branch.id);
  const validatedMessages = await safeValidateUIMessages<UIMessage>({
    messages: parsed.data.messages,
    tools,
  });

  if (!validatedMessages.success) {
    return Response.json(
      { error: "Sohbet mesajları doğrulanamadı." },
      { status: 400 },
    );
  }

  const [categories, menuMessages] = await Promise.all([
    prisma.category.findMany({
      where: { branchId: branch.id },
      orderBy: { sortOrder: "asc" },
    }),
    convertToModelMessages(validatedMessages.data, { tools }),
  ]);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: [
      "Sen Akdo Dondurma'nın Türkçe konuşan menü yönetim asistanısın.",
      "Menüdeki değişiklikleri yalnızca uygun araçları çağırarak yap; araç sonucu gelmeden işlemin başarılı olduğunu söyleme.",
      `Şu anda ${branch.name} şubesinin menüsünü yönetiyorsun. Yalnızca bu şubenin verilerini kullan veya değiştir.`,
      "Yeni ürün eklerken en uygun mevcut kategoriyi kullan. Kategori seçenekleri:",
      ...categories.map((category) => `- ${category.name} (slug: ${category.slug})`),
      "Ürün adı eşleşmiyorsa veya birden fazla ürüne uyuyorsa tahmin yürütme; kullanıcıdan tam ad iste.",
      "Kullanıcı stokta olmayan içecekleri gizlemek isterse hideOutOfStockDrinks aracını çağır.",
      "Araçların sonucunu kısa, açık ve Türkçe biçimde özetle. Fiyatları TL olarak ifade et.",
    ].join("\n"),
    messages: menuMessages,
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("Akdo AI menü komutu başarısız oldu:", error);
      return "Komut işlenirken bir hata oluştu. Lütfen tekrar deneyin.";
    },
  });
}
