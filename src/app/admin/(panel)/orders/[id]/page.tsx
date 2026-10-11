import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { OrderDetail } from "@/components/admin/order-detail";
import { getOrder } from "@/lib/admin-data";
import { israelNow } from "@/lib/pickup";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  if (!order) notFound();
  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex h-10 items-center gap-1 rounded-full pe-3 text-[15px] font-semibold text-muted hover:text-ganache">
        <ChevronRight className="size-4" />
        לכל ההזמנות
      </Link>
      <OrderDetail key={order.updated_at} order={order} today={israelNow().date} />
    </>
  );
}
