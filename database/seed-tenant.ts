import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "egymotelz" },
    update: {},
    create: {
      name: "EGYMOTELZ",
      slug: "egymotelz",
      isDefault: true,
      primaryLocale: "ar",
      status: "ACTIVE",
    },
  });

  await prisma.tenantDomain.upsert({
    where: { hostname: "egymotelz.com" },
    update: { tenantId: tenant.id },
    create: { tenantId: tenant.id, hostname: "egymotelz.com", isPrimary: true, verifiedAt: new Date() },
  });

  await prisma.tenantDomain.upsert({
    where: { hostname: "www.egymotelz.com" },
    update: { tenantId: tenant.id },
    create: { tenantId: tenant.id, hostname: "www.egymotelz.com", isPrimary: false, verifiedAt: new Date() },
  });

  console.log(`Seeded default tenant "${tenant.slug}" (${tenant.id}) with root domains.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
