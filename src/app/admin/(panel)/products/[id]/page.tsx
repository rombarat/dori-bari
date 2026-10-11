import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories, getProduct } from "@/lib/catalog";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, categories] = await Promise.all([getProduct((await params).id), getCategories()]);
  if (!product) notFound();
  return <ProductForm key={product.id} product={product} categories={categories} />;
}
