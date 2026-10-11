import "server-only";
import { getServerSupabase } from "./supabase/server";
import type { Order } from "./types";

const ORDER_COLUMNS =
  "id, order_number, customer_name, phone, notes, fulfillment_type, pickup_date, pickup_time, status, total, created_at, updated_at, order_items(id, product_id, product_name, variant_label, unit_price, quantity, line_total)";

export async function getOrders(): Promise<Order[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(`orders: ${error.message}`);
  return (data ?? []) as Order[];
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`order: ${error.message}`);
  return data as Order | null;
}
