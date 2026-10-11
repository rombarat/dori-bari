import { PageHeader } from "@/components/admin/page-parts";
import { OrdersBoard } from "@/components/admin/orders-board";
import { getOrders } from "@/lib/admin-data";
import { israelNow } from "@/lib/pickup";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const [{ view }, orders] = await Promise.all([searchParams, getOrders()]);
  return (
    <>
      <PageHeader title="הזמנות" description="כל הזמנה שנשלחת מהאתר מופיעה כאן מיד. משנים סטטוס בלחיצה." />
      <OrdersBoard orders={orders} today={israelNow().date} initialView={view} />
    </>
  );
}
