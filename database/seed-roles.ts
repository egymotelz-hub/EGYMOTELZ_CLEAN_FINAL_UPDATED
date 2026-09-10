import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES: { key: string; name: string; isGlobal?: boolean }[] = [
  { key: "guest", name: "Guest" },
  { key: "owner", name: "Property Owner" },
  { key: "contractor", name: "Contractor" },
  { key: "partner", name: "Partner" },
  { key: "hotel_management_company", name: "Hotel Management Company" },
  { key: "financial_partner", name: "Financial Partner" },
  { key: "finance_staff", name: "Finance Staff (internal)" },
  { key: "employee", name: "Employee (internal)" },
  { key: "manager", name: "Manager (internal)" },
  { key: "marketing_manager", name: "Marketing Manager (internal)" },
  { key: "operations_manager", name: "Operations Manager (internal)" },
  { key: "admin", name: "Admin" },
  { key: "super_admin", name: "Super Admin", isGlobal: true },
];

async function main() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name, isGlobal: role.isGlobal ?? false },
      create: { key: role.key, name: role.name, isGlobal: role.isGlobal ?? false },
    });
  }
  console.log(`Seeded ${ROLES.length} roles.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
