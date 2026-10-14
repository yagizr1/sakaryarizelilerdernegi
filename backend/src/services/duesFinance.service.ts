import { prisma } from "../prisma";

function entryDate(dueDate: string) {
  return dueDate || new Date().toISOString().slice(0, 10);
}

/** Ödenen aidatı gelir-gidere yansıtır; ödenmemişse bağlı kaydı siler. */
export async function syncDueFinance(dueId: string) {
  const due = await prisma.due.findUnique({
    where: { id: dueId },
    include: { member: true, financeEntry: true },
  });
  if (!due) return;

  if (due.status !== "odendi") {
    if (due.financeEntry) {
      await prisma.financeEntry.delete({ where: { id: due.financeEntry.id } });
    }
    return;
  }

  const data = {
    date: entryDate(due.dueDate),
    description: `Aidat: ${due.member.firstName} ${due.member.lastName}`.trim(),
    category: "Aidat",
    type: "gelir" as const,
    amount: due.amount,
    dueId: due.id,
  };

  if (due.financeEntry) {
    await prisma.financeEntry.update({
      where: { id: due.financeEntry.id },
      data: {
        date: data.date,
        description: data.description,
        category: data.category,
        amount: data.amount,
      },
    });
  } else {
    await prisma.financeEntry.create({ data });
  }
}
