"use client";

import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  AdminProductDetail,
  AdminProductPayload,
  ProductStatus,
  createAdminProductAction,
  getAdminProductAction,
  updateAdminProductAction,
  updateAdminProductLinksAction,
} from "@/app/(admin)/actions/products";
import type { OptionType } from "@/app/(admin)/actions/option-types";
import {
  Button,
  Field,
  GalleryUpload,
  HtmlEditor,
  IconButton,
  ImageUpload,
  InlineError,
  Input,
  MediaValue,
  Modal,
  MoneyInput,
  Select,
  Spinner,
  Tabs,
  Textarea,
  Toggle,
} from "@/app/(admin)/components/ui";
import { ProductPicker, ProductRef } from "@/app/(admin)/components/pickers";
import { poishaToTaka, slugify, takaToPoisha } from "@/app/(admin)/components/format";

type Option = { id: number; name: string; depth?: number };
type Tab = "details" | "media" | "variants" | "specs" | "seo" | "links";

interface VariantRow {
  id?: number;
  sku: string;
  value: string;
  unit: string;
  price: string;
  discount_price: string;
  cost_price: string;
  stock: string;
  low_stock_threshold: string;
  min_order_qty: string;
  max_order_qty: string;
  weight: string; // grams
  is_active: boolean;
  image: MediaValue | null;
}

interface FormState {
  name: string;
  slug: string;
  category_id: string;
  brand_id: string;
  status: ProductStatus;
  short_description: string;
  description: string;
  is_featured: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  main_image: MediaValue | null;
  gallery: MediaValue[];
  video_url: string;
  option_type_id: string;
  variants: VariantRow[];
  specifications: { key: string; value: string }[];
  tags: string[];
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  related: ProductRef[];
  cross_sell: ProductRef[];
  upsell: ProductRef[];
}

const blankVariant = (): VariantRow => ({
  sku: "",
  value: "",
  unit: "",
  price: "",
  discount_price: "",
  cost_price: "",
  stock: "0",
  low_stock_threshold: "",
  min_order_qty: "1",
  max_order_qty: "",
  weight: "",
  is_active: true,
  image: null,
});

const blankForm = (): FormState => ({
  name: "",
  slug: "",
  category_id: "",
  brand_id: "",
  status: "draft",
  short_description: "",
  description: "",
  is_featured: false,
  is_trending: false,
  is_new_arrival: true,
  is_best_seller: false,
  main_image: null,
  gallery: [],
  video_url: "",
  option_type_id: "",
  variants: [blankVariant()],
  specifications: [],
  tags: [],
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  related: [],
  cross_sell: [],
  upsell: [],
});

const str = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));
const intOrNull = (v: string) => (v.trim() === "" ? null : Math.round(Number(v)));

function fromDetail(p: AdminProductDetail): FormState {
  return {
    name: p.name,
    slug: p.slug,
    category_id: str(p.category_id),
    brand_id: str(p.brand_id),
    status: p.status,
    short_description: p.short_description ?? "",
    description: p.description ?? "",
    is_featured: p.is_featured,
    is_trending: p.is_trending,
    is_new_arrival: p.is_new_arrival,
    is_best_seller: p.is_best_seller,
    main_image: p.main_image ? { id: p.main_image.id, url: p.main_image.url } : null,
    gallery: (p.gallery ?? []).map((g) => ({ id: g.id, url: g.url })),
    video_url: p.video_url ?? "",
    option_type_id: str(p.option_type_id),
    variants: p.variants.length
      ? p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          value: v.value ?? "",
          unit: v.unit ?? "",
          price: poishaToTaka(v.price),
          discount_price: poishaToTaka(v.discount_price),
          cost_price: poishaToTaka(v.cost_price),
          stock: str(v.stock),
          low_stock_threshold: str(v.low_stock_threshold),
          min_order_qty: str(v.min_order_qty ?? 1),
          max_order_qty: str(v.max_order_qty),
          weight: str(v.weight_grams),
          is_active: v.is_active ?? true,
          image: v.image ? { id: v.image.id, url: v.image.url } : null,
        }))
      : [blankVariant()],
    specifications: p.specifications ?? [],
    tags: p.tags ?? [],
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    seo_keywords: p.seo_keywords ?? "",
    related: p.links?.related ?? [],
    cross_sell: p.links?.cross_sell ?? [],
    upsell: p.links?.upsell ?? [],
  };
}

/** Client-side checks that mirror the API rules, so most mistakes are caught before saving. */
function validate(f: FormState): { tab: Tab; message: string } | null {
  if (!f.name.trim()) return { tab: "details", message: "Product name is required." };
  if (!f.category_id) return { tab: "details", message: "Choose a category." };
  if (f.video_url && !/^https:\/\//.test(f.video_url)) return { tab: "media", message: "The video link must start with https://." };
  if (f.variants.length === 0) return { tab: "variants", message: "Add at least one variant." };
  const skus = new Set<string>();
  for (const [i, v] of f.variants.entries()) {
    const n = f.variants.length > 1 ? ` (variant ${i + 1})` : "";
    if (!v.sku.trim()) return { tab: "variants", message: `SKU is required${n}.` };
    if (skus.has(v.sku.trim().toUpperCase())) return { tab: "variants", message: `SKU ${v.sku} is used twice.` };
    skus.add(v.sku.trim().toUpperCase());
    if (f.option_type_id && !v.value.trim()) return { tab: "variants", message: `Enter the option value${n}.` };
    const price = takaToPoisha(v.price);
    if (price === null || price < 0) return { tab: "variants", message: `Enter a price${n}.` };
    const disc = takaToPoisha(v.discount_price);
    if (disc !== null && disc >= price) return { tab: "variants", message: `The discount price must be lower than the price${n}.` };
    const min = intOrNull(v.min_order_qty);
    const max = intOrNull(v.max_order_qty);
    if (min !== null && max !== null && max < min) return { tab: "variants", message: `Maximum order quantity is below the minimum${n}.` };
  }
  if (f.specifications.some((s) => !s.key.trim() || !s.value.trim()))
    return { tab: "specs", message: "Every specification needs a name and a value, or remove the empty row." };
  return null;
}

function toPayload(f: FormState): AdminProductPayload {
  const hasOption = !!f.option_type_id;
  return {
    name: f.name.trim(),
    slug: f.slug.trim() || null,
    category_id: Number(f.category_id),
    brand_id: f.brand_id ? Number(f.brand_id) : null,
    status: f.status,
    short_description: f.short_description.trim() || null,
    description: f.description.trim() || null,
    is_featured: f.is_featured,
    is_trending: f.is_trending,
    is_new_arrival: f.is_new_arrival,
    is_best_seller: f.is_best_seller,
    main_image_id: f.main_image?.id ?? null,
    gallery_image_ids: f.gallery.map((g) => g.id),
    video_url: f.video_url.trim() || null,
    option_type_id: hasOption ? Number(f.option_type_id) : null,
    variants: f.variants.map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      sku: v.sku.trim(),
      ...(hasOption ? { value: v.value.trim(), unit: v.unit.trim() || null } : {}),
      price: takaToPoisha(v.price) ?? 0,
      discount_price: takaToPoisha(v.discount_price),
      cost_price: takaToPoisha(v.cost_price),
      stock: Math.max(0, intOrNull(v.stock) ?? 0),
      low_stock_threshold: intOrNull(v.low_stock_threshold),
      min_order_qty: Math.max(1, intOrNull(v.min_order_qty) ?? 1),
      max_order_qty: intOrNull(v.max_order_qty),
      weight_grams: intOrNull(v.weight),
      image_id: v.image?.id ?? null,
      is_active: v.is_active,
    })),
    specifications: f.specifications.length ? f.specifications.map((s) => ({ key: s.key.trim(), value: s.value.trim() })) : null,
    tags: f.tags,
    seo_title: f.seo_title.trim() || null,
    seo_description: f.seo_description.trim() || null,
    seo_keywords: f.seo_keywords.trim() || null,
  };
}

export function ProductFormModal({
  open,
  productId,
  categories,
  brands,
  optionTypes,
  onClose,
  onSaved,
}: {
  open: boolean;
  productId: number | null;
  categories: Option[];
  brands: Option[];
  optionTypes: OptionType[];
  onClose: () => void;
  onSaved: (name: string, created: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(blankForm);
  const [original, setOriginal] = useState<AdminProductDetail | null>(null);
  const [tab, setTab] = useState<Tab>("details");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [loadedFor, setLoadedFor] = useState<number | null | undefined>(undefined);

  // Reset or load whenever the modal opens for a different product (adjusted during render).
  const key = open ? productId : undefined;
  if (key !== loadedFor) {
    setLoadedFor(key);
    if (open) {
      setTab("details");
      setFormError(null);
      setTagInput("");
      setOriginal(null);
      setForm(blankForm());
      setLoading(!!productId);
    }
  }

  // Fetch the product being edited; state is only set from the async callback.
  useEffect(() => {
    if (!open || !productId) return;
    let cancelled = false;
    getAdminProductAction(productId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.success) {
        setOriginal(res.data);
        setForm(fromDetail(res.data));
      } else setFormError(res.error.message);
    });
    return () => {
      cancelled = true;
    };
  }, [open, productId]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setVariant = (i: number, patch: Partial<VariantRow>) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t) && form.tags.length < 30) set("tags", [...form.tags, t.slice(0, 64)]);
    setTagInput("");
  };

  const save = async () => {
    const problem = validate(form);
    if (problem) {
      setTab(problem.tab);
      setFormError(problem.message);
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = toPayload(form);
    const res = productId ? await updateAdminProductAction(productId, payload) : await createAdminProductAction(payload);
    if (!res.success) {
      setSaving(false);
      setFormError(res.error.message);
      return;
    }

    // Linked products are saved through their own endpoint.
    const ids = (l: ProductRef[]) => l.map((p) => p.id);
    const links = { related: ids(form.related), cross_sell: ids(form.cross_sell), upsell: ids(form.upsell) };
    const before = original?.links;
    const changed =
      !before
        ? links.related.length + links.cross_sell.length + links.upsell.length > 0
        : JSON.stringify(links) !==
          JSON.stringify({ related: ids(before.related), cross_sell: ids(before.cross_sell), upsell: ids(before.upsell) });
    if (changed) {
      const lr = await updateAdminProductLinksAction(res.data.id, links);
      if (!lr.success) {
        setSaving(false);
        setFormError(`Product saved, but linked products failed: ${lr.error.message}`);
        return;
      }
    }
    setSaving(false);
    onSaved(res.data.name, !productId);
  };

  const hasOption = !!form.option_type_id;
  const optionName = optionTypes.find((o) => String(o.id) === form.option_type_id)?.name ?? "Option";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={productId ? (original ? `Edit ${original.name}` : "Edit product") : "New product"}
      description={original ? `Sold ${original.sold_count} · viewed ${original.view_count} · rating ${original.rating_avg || "—"}` : undefined}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button loading={saving} disabled={loading} onClick={save}>
            {productId ? "Save product" : "Create product"}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-5">
          <Tabs<Tab>
            tabs={[
              { value: "details", label: "Details" },
              { value: "media", label: "Images" },
              { value: "variants", label: "Price & stock", count: form.variants.length },
              { value: "specs", label: "Specifications" },
              { value: "seo", label: "SEO & tags" },
              { value: "links", label: "Linked products" },
            ]}
            value={tab}
            onChange={setTab}
          />
          <InlineError message={formError} />

          {tab === "details" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Product name" required className="sm:col-span-2">
                  <Input
                    value={form.name}
                    maxLength={255}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({ ...f, name, slug: productId || f.slug !== slugify(f.name) ? f.slug : slugify(name) }));
                    }}
                    autoFocus
                  />
                </Field>
                <Field label="Category" required>
                  <Select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
                    <option value="">Choose a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {"— ".repeat(c.depth ?? 0)}
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Brand">
                  <Select value={form.brand_id} onChange={(e) => set("brand_id", e.target.value)}>
                    <option value="">No brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="URL slug" hint="Leave blank to generate from the name.">
                  <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} maxLength={180} />
                </Field>
                <Field label="Status">
                  <Select value={form.status} onChange={(e) => set("status", e.target.value as ProductStatus)}>
                    <option value="active">Active (on sale)</option>
                    <option value="draft">Draft (not published)</option>
                    <option value="hidden">Hidden (off sale)</option>
                  </Select>
                </Field>
              </div>
              <Field label="Short description" hint="Shown near the price. Up to 1000 characters.">
                <Textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} rows={2} maxLength={1000} />
              </Field>
              <Field label="Full description">
                <HtmlEditor value={form.description} onChange={(v) => set("description", v)} rows={10} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl ring-1 ring-slate-200 p-4">
                <Toggle checked={form.is_featured} onChange={(v) => set("is_featured", v)} label="Featured" description="Home page featured section" />
                <Toggle checked={form.is_trending} onChange={(v) => set("is_trending", v)} label="Trending" />
                <Toggle checked={form.is_new_arrival} onChange={(v) => set("is_new_arrival", v)} label="New arrival" />
                <Toggle checked={form.is_best_seller} onChange={(v) => set("is_best_seller", v)} label="Best seller" />
              </div>
            </div>
          )}

          {tab === "media" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field label="Main image" hint="Square images look best.">
                  <ImageUpload value={form.main_image} onChange={(v) => set("main_image", v)} />
                </Field>
                <Field label="Gallery" className="sm:col-span-2" hint="Up to 50 extra images.">
                  <GalleryUpload value={form.gallery} onChange={(v) => set("gallery", v)} max={50} />
                </Field>
              </div>
              <Field label="Video link" hint="An https link, e.g. a YouTube video.">
                <Input type="url" value={form.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://" />
              </Field>
            </div>
          )}

          {tab === "variants" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <Field label="Variants differ by" hint={hasOption ? undefined : "Choose an option to sell several sizes or weights."}>
                  <Select
                    value={form.option_type_id}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({
                        ...f,
                        option_type_id: v,
                        variants: v ? f.variants : f.variants.slice(0, 1).map((x) => ({ ...x, value: "", unit: "" })),
                      }));
                    }}
                  >
                    <option value="">Nothing (single variant)</option>
                    {optionTypes.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                {hasOption && (
                  <Button variant="secondary" icon={Plus} className="sm:justify-self-end" onClick={() => set("variants", [...form.variants, blankVariant()])} disabled={form.variants.length >= 100}>
                    Add {optionName.toLowerCase()}
                  </Button>
                )}
              </div>
              {productId && (
                <p className="text-xs text-slate-500">Saving replaces the full set of variants. Removing a row deletes that variant.</p>
              )}
              <div className="space-y-3">
                {form.variants.map((v, i) => (
                  <div key={v.id ?? `new-${i}`} className="rounded-xl ring-1 ring-slate-200 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {hasOption ? `${optionName}: ${v.value || "new"}${v.unit ? ` ${v.unit}` : ""}` : "Price and stock"}
                      </span>
                      <span className="flex items-center gap-3">
                        <Toggle checked={v.is_active} onChange={(val) => setVariant(i, { is_active: val })} label="On sale" />
                        {form.variants.length > 1 && (
                          <IconButton label="Remove variant" icon={X} tone="danger" onClick={() => set("variants", form.variants.filter((_, j) => j !== i))} />
                        )}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {hasOption && (
                        <>
                          <Field label={optionName} required>
                            <Input value={v.value} onChange={(e) => setVariant(i, { value: e.target.value })} maxLength={64} placeholder="e.g. 1.5" />
                          </Field>
                          <Field label="Unit">
                            <Input value={v.unit} onChange={(e) => setVariant(i, { unit: e.target.value })} maxLength={16} placeholder="kg, m, L" />
                          </Field>
                        </>
                      )}
                      <Field label="SKU" required>
                        <Input value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value.toUpperCase() })} maxLength={64} className="font-mono" />
                      </Field>
                      <Field label="Price" required>
                        <MoneyInput value={v.price} onChange={(val) => setVariant(i, { price: val })} />
                      </Field>
                      <Field label="Sale price">
                        <MoneyInput value={v.discount_price} onChange={(val) => setVariant(i, { discount_price: val })} placeholder="—" />
                      </Field>
                      <Field label="Cost price">
                        <MoneyInput value={v.cost_price} onChange={(val) => setVariant(i, { cost_price: val })} placeholder="—" />
                      </Field>
                      <Field label="Stock">
                        <Input type="number" min={0} value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value })} />
                      </Field>
                      <Field label="Low stock alert at">
                        <Input type="number" min={0} value={v.low_stock_threshold} onChange={(e) => setVariant(i, { low_stock_threshold: e.target.value })} placeholder="Store default" />
                      </Field>
                      <Field label="Weight (g)">
                        <Input type="number" min={0} value={v.weight} onChange={(e) => setVariant(i, { weight: e.target.value })} />
                      </Field>
                      <Field label="Min. order qty">
                        <Input type="number" min={1} value={v.min_order_qty} onChange={(e) => setVariant(i, { min_order_qty: e.target.value })} />
                      </Field>
                      <Field label="Max. order qty">
                        <Input type="number" min={1} value={v.max_order_qty} onChange={(e) => setVariant(i, { max_order_qty: e.target.value })} placeholder="No limit" />
                      </Field>
                    </div>
                    {hasOption && (
                      <div className="w-24">
                        <ImageUpload value={v.image} onChange={(img) => setVariant(i, { image: img })} label="Image" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "specs" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Technical details shown in a table on the product page.</p>
              {form.specifications.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
                  <Input
                    value={s.key}
                    placeholder="Name, e.g. Capacity"
                    maxLength={100}
                    aria-label="Specification name"
                    onChange={(e) => set("specifications", form.specifications.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}
                  />
                  <Input
                    value={s.value}
                    placeholder="Value, e.g. 4.5 kg"
                    maxLength={1000}
                    aria-label="Specification value"
                    onChange={(e) => set("specifications", form.specifications.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                  />
                  <IconButton label="Remove" icon={X} tone="danger" onClick={() => set("specifications", form.specifications.filter((_, j) => j !== i))} />
                </div>
              ))}
              <Button
                variant="secondary"
                icon={Plus}
                disabled={form.specifications.length >= 100}
                onClick={() => set("specifications", [...form.specifications, { key: "", value: "" }])}
              >
                Add specification
              </Button>
            </div>
          )}

          {tab === "seo" && (
            <div className="space-y-4">
              <Field label="Tags" hint="Press Enter to add. Helps search.">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-md bg-slate-100 pl-2 pr-1 py-0.5 text-xs font-medium text-slate-700">
                      {t}
                      <button type="button" aria-label={`Remove ${t}`} onClick={() => set("tags", form.tags.filter((x) => x !== t))} className="p-0.5 rounded hover:bg-slate-200">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                  placeholder="Add a tag"
                />
              </Field>
              <Field label="SEO title">
                <Input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} maxLength={255} placeholder={form.name} />
              </Field>
              <Field label="SEO description" hint={`${form.seo_description.length}/500`}>
                <Textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} rows={3} maxLength={500} />
              </Field>
              <Field label="SEO keywords" hint="Comma separated.">
                <Input value={form.seo_keywords} onChange={(e) => set("seo_keywords", e.target.value)} maxLength={500} />
              </Field>
            </div>
          )}

          {tab === "links" && (
            <div className="space-y-5">
              <Field label="Related products" hint="Shown as “You may also like”.">
                <ProductPicker value={form.related} onChange={(v) => set("related", v)} excludeIds={productId ? [productId] : []} />
              </Field>
              <Field label="Frequently bought together" hint="Cross-sells shown in the cart.">
                <ProductPicker value={form.cross_sell} onChange={(v) => set("cross_sell", v)} excludeIds={productId ? [productId] : []} />
              </Field>
              <Field label="Upgrades" hint="Better or bigger alternatives (upsells).">
                <ProductPicker value={form.upsell} onChange={(v) => set("upsell", v)} excludeIds={productId ? [productId] : []} />
              </Field>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
