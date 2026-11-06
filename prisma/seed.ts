import { prisma } from "../src/lib/prisma";

async function main() {
  const branch = await prisma.branch.upsert({
    where: { slug: "merkez" },
    update: { name: "Merkez Şube", isActive: true },
    create: {
      name: "Merkez Şube",
      slug: "merkez",
      city: "Elbistan",
      district: "Merkez",
      address: "Merkez",
      isActive: true,
      isDefault: true,
    },
  });

  await prisma.diningTable.upsert({
    where: { code: "123456" },
    update: { name: "Masa 1", isActive: true, branchId: branch.id },
    create: {
      name: "Masa 1",
      code: "123456",
      isActive: true,
      branchId: branch.id,
    },
  });

  const category = await prisma.category.upsert({
    where: {
      branchId_slug: { branchId: branch.id, slug: "ana-yemekler" },
    },
    update: { name: "Ana Yemekler", isActive: true },
    create: {
      name: "Ana Yemekler",
      slug: "ana-yemekler",
      icon: "🍽️",
      isActive: true,
      sortOrder: 1,
      branchId: branch.id,
    },
  });

  await prisma.product.upsert({
    where: { id: "demo-adana-kebap" },
    update: { isActive: true },
    create: {
      id: "demo-adana-kebap",
      name: "Adana Kebap",
      description: "Izgara, lavaş ve mezeler ile",
      price: 42000,
      imageUrl: "",
      stock: 20,
      isActive: true,
      featured: true,
      sortOrder: 1,
      categoryId: category.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
