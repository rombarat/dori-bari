"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ImagePlus, Plus, Trash2, X } from "lucide-react";
import clsx from "clsx";
import { z } from "zod";
import { toast } from "sonner";
import { Panel } from "./page-parts";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { removeStoredImage, uploadProductImage } from "@/lib/product-images";
import type { Category, Product, Variant } from "@/lib/types";

const TAG_PRESETS = ["ללא גלוטן", "טבעוני", "ללא תוספת סוכר", "פרווה", "אפשרות לפרווה"];

const priceField = z
  .string()
  .trim()
  .min(1, "נא למלא מחיר")
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0 && Number(v) <= 100000, "מחיר לא תקין");

const schema = z.object({
  name: z.string().trim().min(2, "נא למלא שם מוצר").max(120, "השם ארוך מדי"),
  price: priceField,
  description: z.string().max(1000, "התיאור ארוך מדי"),
  unit_label: z.string().max(40, "קצר יותר, בבקשה"),
  variants: z.array(z.object({ label: z.string().trim().min(1, "חסר שם לאפשרות"), price: priceField })),
});

type VariantDraft = { id: string; label: string; price: string };
type Errors = Partial<Record<"name" | "price" | "description" | "unit_label" | "variants" | "image", string>>;

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !product;

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(product ? String(Number(product.price)) : "");
  const [unitLabel, setUnitLabel] = useState(product?.unit_label ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [available, setAvailable] = useState(product?.is_available ?? true);
  const [featured, setFeatured] = useState(product?.is_featured ?? false);
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);
  const [variants, setVariants] = useState<VariantDraft[]>(
    (product?.variants ?? []).map((v) => ({ id: v.id, label: v.label, price: String(v.price) })),
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const uploadedThisSession = useRef<string[]>([]);

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setErrors((e) => ({ ...e, image: undefined }));
    try {
      const url = await uploadProductImage(file);
      uploadedThisSession.current.push(url);
      setImageUrl(url);
    } catch (err) {
      const msg = err instanceof Error && err.message === "NOT_IMAGE" ? "הקובץ שנבחר אינו תמונה." : "התמונה לא הועלתה. נסו תמונה אחרת או בדקו את החיבור.";
      setErrors((e) => ({ ...e, image: msg }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clearError = (key: keyof Errors) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  const toggleTag = (tag: string) => setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, price: variants.length ? "0" : price, description, unit_label: unitLabel, variants });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      toast.error("יש שדות שצריך לתקן");
      return;
    }
    setErrors({});
    setSaving(true);

    const cleanVariants: Variant[] = parsed.data.variants.map((v, i) => ({
      id: variants[i].id,
      label: v.label,
      price: Number(v.price),
    }));
    const row = {
      name: parsed.data.name,
      category_id: categoryId || null,
      price: cleanVariants.length ? Math.min(...cleanVariants.map((v) => v.price)) : Number(parsed.data.price),
      unit_label: parsed.data.unit_label.trim(),
      description: parsed.data.description.trim(),
      image_url: imageUrl,
      is_available: available,
      is_featured: featured,
      tags,
      variants: cleanVariants,
    };

    const supabase = getBrowserSupabase();
    const { error } = isNew
      ? await supabase.from("products").insert({ ...row, sort_order: 999 })
      : await supabase.from("products").update(row).eq("id", product.id);
    setSaving(false);

    if (error) {
      toast.error("המוצר לא נשמר. בדקו את החיבור ונסו שוב.");
      return;
    }
    // Clean up images that were uploaded and then replaced before saving, and the old image on edit.
    const keep = imageUrl;
    for (const url of uploadedThisSession.current) if (url !== keep) void removeStoredImage(url);
    if (product?.image_url && product.image_url !== keep) void removeStoredImage(product.image_url);

    toast.success(isNew ? `״${row.name}״ נוסף לתפריט` : "השינויים נשמרו");
    router.push("/admin/products");
    router.refresh();
  };

  const onDelete = async () => {
    if (!product) return;
    setDeleting(true);
    const { error } = await getBrowserSupabase().from("products").delete().eq("id", product.id);
    setDeleting(false);
    if (error) {
      toast.error("המוצר לא נמחק. בדקו את החיבור ונסו שוב.");
      return;
    }
    void removeStoredImage(product.image_url);
    toast.success(`״${product.name}״ נמחק מהתפריט`);
    router.push("/admin/products");
    router.refresh();
  };

  const hasVariants = variants.length > 0;

  return (
    <form onSubmit={onSubmit} noValidate>
      <Link href="/admin/products" className="mb-4 inline-flex h-10 items-center gap-1 rounded-full pe-3 text-[15px] font-semibold text-muted hover:text-ganache">
        <ChevronRight className="size-4" />
        לכל המוצרים
      </Link>
      <h1 className="mb-7 font-display text-[36px] leading-none md:text-[44px]">{isNew ? "מוצר חדש" : "עריכת מוצר"}</h1>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        {/* Image */}
        <Panel className="p-4">
          <p className="mb-3 text-[15px] font-semibold">תמונה</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={clsx(
              "group relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[var(--radius-photo)] border-2 border-dashed transition-colors",
              imageUrl ? "border-transparent" : "border-crumb bg-meringue/50 hover:border-cocoa/40",
            )}
            aria-label={imageUrl ? "החלפת תמונה" : "העלאת תמונה"}
          >
            {imageUrl ? (
              <>
                <Image src={imageUrl} alt="" fill sizes="320px" className="object-cover" />
                <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/95 py-2 text-[15px] font-semibold opacity-100 shadow-sm md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                  החלפת תמונה
                </span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-2 px-6 text-center text-muted">
                <ImagePlus className="size-8 text-cocoa" strokeWidth={1.5} />
                <span className="font-semibold text-ganache">הוספת תמונה</span>
                <span className="text-[14px]">צלמו או בחרו מהגלריה</span>
              </span>
            )}
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center gap-2 bg-white/80 font-semibold">
                <Spinner className="size-5" /> מעלה תמונה…
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0])} />
          {imageUrl && !uploading && (
            <button type="button" onClick={() => setImageUrl(null)} className="mt-2 text-[14px] font-semibold text-muted underline-offset-2 hover:text-raspberry hover:underline">
              הסרת התמונה
            </button>
          )}
          {errors.image && (
            <p className="mt-2 text-[14px] text-raspberry" role="alert">
              {errors.image}
            </p>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel className="space-y-5 p-5 md:p-6">
            <Field label="שם המוצר" htmlFor="name" error={errors.name}>
              <Input id="name" value={name} onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }} invalid={!!errors.name} placeholder="למשל: טארט פקאן" maxLength={120} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="קטגוריה" htmlFor="category">
                <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="">ללא קטגוריה</option>
                </Select>
              </Field>
              <Field label="מחיר (₪)" htmlFor="price" error={errors.price} hint={hasVariants ? "נקבע לפי האפשרויות למטה" : undefined}>
                <Input
                  id="price"
                  inputMode="decimal"
                  dir="ltr"
                  className="text-right"
                  value={hasVariants ? String(Math.min(...variants.map((v) => Number(v.price) || 0))) : price}
                  onChange={(e) => {
                    setPrice(e.target.value.replace(/[^\d.]/g, ""));
                    clearError("price");
                  }}
                  disabled={hasVariants}
                  invalid={!!errors.price && !hasVariants}
                  placeholder="0"
                />
              </Field>
            </div>

            <Field label="יחידה / גודל" htmlFor="unit" optional error={errors.unit_label} hint="למשל: עוגה שלמה, 10 יחידות, טארט גדול">
              <Input id="unit" value={unitLabel} onChange={(e) => {
                setUnitLabel(e.target.value);
                clearError("unit_label");
              }} maxLength={40} />
            </Field>

            <Field label="תיאור" htmlFor="description" optional error={errors.description}>
              <Textarea id="description" value={description} onChange={(e) => {
                setDescription(e.target.value);
                clearError("description");
              }} maxLength={1000} placeholder="ממה זה עשוי, למי זה מתאים" />
            </Field>

            <fieldset>
              <legend className="mb-2 text-[15px] font-semibold">תגיות</legend>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...TAG_PRESETS, ...tags])].map((tag) => {
                  const on = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleTag(tag)}
                      className={clsx(
                        "h-9 rounded-full border px-3.5 text-[14px] font-semibold transition-colors",
                        on ? "border-pistachio bg-pistachio-soft text-pistachio" : "border-crumb bg-white text-muted hover:border-cocoa/40",
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </Panel>

          <Panel className="divide-y divide-crumb">
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">זמין להזמנה</p>
                <p className="text-[14px] text-muted">כשכבוי, המוצר מופיע בחנות כ״אזל כרגע״ ואי אפשר להזמין אותו.</p>
              </div>
              <Switch checked={available} onChange={setAvailable} label="זמין להזמנה" />
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">מומלץ בדף הבית</p>
                <p className="text-[14px] text-muted">יוצג באזור ״המומלצים שלנו״.</p>
              </div>
              <Switch checked={featured} onChange={setFeatured} label="מומלץ בדף הבית" />
            </div>
          </Panel>

          <Panel className="p-5">
            <p className="font-semibold">
              אפשרויות מחיר <span className="font-normal text-muted">(לא חובה)</span>
            </p>
            <p className="text-[14px] text-muted">למשל: עוגייה אחת ב-₪20, או 3 עוגיות ב-₪55. הלקוח יבחר אחת מהן.</p>
            {variants.length > 0 && (
              <ul className="mt-4 space-y-2">
                {variants.map((v, i) => (
                  <li key={v.id} className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`v-label-${i}`}>
                      שם האפשרות
                    </label>
                    <Input
                      id={`v-label-${i}`}
                      value={v.label}
                      placeholder="שם האפשרות"
                      onChange={(e) => setVariants((list) => list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                      className="flex-1"
                    />
                    <label className="sr-only" htmlFor={`v-price-${i}`}>
                      מחיר
                    </label>
                    <Input
                      id={`v-price-${i}`}
                      value={v.price}
                      inputMode="decimal"
                      dir="ltr"
                      placeholder="₪"
                      onChange={(e) =>
                        setVariants((list) => list.map((x, j) => (j === i ? { ...x, price: e.target.value.replace(/[^\d.]/g, "") } : x)))
                      }
                      className="w-24 text-right"
                    />
                    <button
                      type="button"
                      onClick={() => setVariants((list) => list.filter((_, j) => j !== i))}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-meringue hover:text-raspberry"
                      aria-label={`הסרת האפשרות ${v.label || i + 1}`}
                    >
                      <X className="size-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {errors.variants && (
              <p className="mt-2 text-[14px] text-raspberry" role="alert">
                {errors.variants}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 -ms-2"
              icon={<Plus className="size-4" />}
              onClick={() => setVariants((list) => [...list, { id: crypto.randomUUID().slice(0, 8), label: "", price: "" }])}
            >
              הוספת אפשרות
            </Button>
          </Panel>

          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-crumb bg-[#faf6f3]/95 px-4 py-3 backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
            <Button type="submit" size="lg" loading={saving} disabled={uploading} className="flex-1 md:flex-none md:px-10">
              {isNew ? "הוספה לתפריט" : "שמירת שינויים"}
            </Button>
            {!isNew && (
              <Button variant="danger" size="lg" icon={<Trash2 className="size-[18px]" />} onClick={() => setConfirmDelete(true)}>
                מחיקה
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`למחוק את ״${product?.name ?? ""}״?`}
        body="המוצר יימחק מהתפריט לצמיתות. אם הוא רק נגמר, עדיף לכבות את ״זמין להזמנה״. הזמנות קודמות לא ייפגעו."
        confirmLabel="מחיקה"
        destructive
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  );
}
