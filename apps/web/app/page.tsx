import { PrismaClient } from "@repo/db";
import DashboardClient from "./DashboardClient";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const errorGroups = await prisma.errorGroup.findMany({
    include: {
      events: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      _count: {
        select: { events: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return <DashboardClient errorGroups={errorGroups} />;
}
