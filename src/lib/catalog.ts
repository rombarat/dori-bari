import "server-only";
import { getServerSupabase } from "./supabase/server";
import type { BlockedDate, BusinessSettings, Category, Product } from "./types";

const PRODUCT_COLUMNS =
  "id, category_id, name, description, price, unit_label, image_url, is_available, is_featured, tags, variants, sort_order";

export async function getCategories(): Promise<Category[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, image_url, sort_order")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`categories: ${error.message}`);
  return data ?? [];
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).order("sort_order").order("name");
  if (error) throw new Error(`products: ${error.message}`);
  return (data ?? []) as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`product: ${error.message}`);
  return data as Product | null;
}

export async function getSettings(): Promise<BusinessSettings> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("business_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(`settings: ${error.message}`);
  return data as BusinessSettings;
}

export async function getBlockedDates(): Promise<BlockedDate[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("blocked_dates").select("date, reason").order("date");
  if (error) throw new Error(`blocked dates: ${error.message}`);
  return data ?? [];
}

/** Orders categories by sort order and keeps only those with products. */
export function groupByCategory(categories: Category[], products: Product[]) {
  return categories
    .map((category) => ({ category, products: products.filter((p) => p.category_id === category.id) }))
    .filter((g) => g.products.length > 0);
}
