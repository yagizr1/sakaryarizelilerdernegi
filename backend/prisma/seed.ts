import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin", 10);

  // Eski hesabı temizle
  await prisma.user.deleteMany({ where: { email: "admin@dernek.local" } });

  await prisma.user.upsert({
    where: { email: "admin" },
    update: { role: "ADMIN", passwordHash, name: "Yönetici" },
    create: {
      name: "Yönetici",
      email: "admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.setting.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      name: "Sakarya Rizeliler Derneği",
      shortName: "SRD",
      phone: "",
      email: "info@dernek.local",
      address: "",
    },
  });

  const memberPass = await bcrypt.hash("uye12345", 10);
  const existingDemo = await prisma.member.findFirst({ where: { nationalId: "10000000146" } });
  if (!existingDemo) {
    await prisma.member.create({
      data: {
        firstName: "Demo",
        lastName: "Üye",
        nationalId: "10000000146",
        phone: "05320000000",
        email: "uye@dernek.local",
        passwordHash: memberPass,
        status: "aktif",
        memberNo: "UYE-0001",
        joinDate: new Date().toISOString().slice(0, 10),
        profession: "Örnek",
      },
    });
  } else if (!existingDemo.passwordHash) {
    await prisma.member.update({
      where: { id: existingDemo.id },
      data: { passwordHash: memberPass, status: "aktif" },
    });
  }

  console.log("Seed tamam.");
  console.log("Yönetici: admin / admin");
  console.log("Demo üye TC: 10000000146 / uye12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
