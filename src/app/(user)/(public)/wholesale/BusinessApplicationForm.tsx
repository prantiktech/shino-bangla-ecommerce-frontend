"use client";

import React, { useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const EMAIL = /^\S+@\S+\.\S+$/;
const BD_MOBILE = /^01[3-9]\d{8}$/;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const FILE_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf";

const BUSINESS_TYPES = [
  { value: "proprietorship", label: "Sole proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "limited_company", label: "Limited company" },
  { value: "other", label: "Other" },
];

const input =
  "w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 aria-[invalid=true]:border-rose-400";

type FieldErrors = Record<string, string>;

const cleanPhone = (v: string) => v.trim().replace(/[\s-]/g, "").replace(/^\+?88(?=01)/, "");

function fileProblem(f: File): string | null {
  if (!FILE_TYPES.includes(f.type)) return `${f.name}: use a JPG, PNG, WebP or PDF file.`;
  if (f.size > MAX_FILE_BYTES) return `${f.name}: files must be 4 MB or smaller.`;
  return null;
}

function Label({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
      {children}
      {optional ? <span className="text-slate-400 font-normal"> (optional)</span> : <span className="text-rose-500"> *</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-rose-600">{message}</p> : null;
}

function FilePicker({
  id,
  files,
  multiple,
  max = 1,
  onChange,
  error,
}: {
  id: string;
  files: File[];
  multiple?: boolean;
  max?: number;
  onChange: (files: File[]) => void;
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = Array.from(list);
    const bad = incoming.map(fileProblem).find(Boolean);
    setProblem(bad ?? null);
    const good = incoming.filter((f) => !fileProblem(f));
    onChange(multiple ? [...files, ...good].slice(0, max) : good.slice(0, 1));
    if (ref.current) ref.current.value = "";
  };

  return (
    <div className="space-y-2">
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg bg-slate-50 ring-1 ring-slate-200 px-3 py-2 text-sm">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex-1 min-w-0 truncate text-slate-700">{f.name}</span>
              <span className="text-xs text-slate-400 shrink-0">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {files.length < max && (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={`w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed text-sm font-medium text-slate-500 hover:border-brand-300 hover:text-primary hover:bg-brand-50/40 transition-colors ${
            error || problem ? "border-rose-300" : "border-slate-200"
          }`}
        >
          <Paperclip className="w-4 h-4" />
          {files.length ? "Add another file" : "Choose a file"}
          <span className="text-xs text-slate-400 font-normal">JPG, PNG, WebP or PDF · up to 4 MB</span>
        </button>
      )}
      <input id={id} ref={ref} type="file" accept={FILE_ACCEPT} multiple={multiple} className="hidden" onChange={(e) => add(e.target.files)} />
      <FieldError message={problem ?? error} />
    </div>
  );
}

export function BusinessApplicationForm({ districts }: { districts: { id: number; name: string }[] }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    business_name: "",
    business_type: "proprietorship",
    trade_license_number: "",
    bin_tin: "",
    business_address: "",
    district_id: "",
    interested_in: "",
    contact_name: "",
    designation: "",
    phone: "",
    email: "",
    alternate_phone: "",
    message: "",
    website: "",
  });
  const [tradeLicense, setTradeLicense] = useState<File[]>([]);
  const [nidFront, setNidFront] = useState<File[]>([]);
  const [nidBack, setNidBack] = useState<File[]>([]);
  const [prefilled, setPrefilled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState<string | null>(null);

  // Prefill the contact from the signed-in account once (adjusted during render).
  if (user && !prefilled) {
    setPrefilled(true);
    setForm((f) => ({ ...f, contact_name: f.contact_name || user.name, email: f.email || user.email || "", phone: f.phone || user.phone || "" }));
  }

  type Key = keyof typeof form;
  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    if (errors[k]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
    }
  };

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!form.business_name.trim()) e.business_name = "Enter the business name.";
    if (!form.trade_license_number.trim()) e.trade_license_number = "Enter the trade licence number.";
    if (!form.business_address.trim()) e.business_address = "Enter the business address.";
    if (!form.district_id) e.district_id = "Choose the district.";
    if (!form.contact_name.trim()) e.contact_name = "Enter the contact person's name.";
    if (!BD_MOBILE.test(cleanPhone(form.phone))) e.phone = "Enter a valid mobile number (01XXXXXXXXX).";
    if (form.alternate_phone.trim() && !BD_MOBILE.test(cleanPhone(form.alternate_phone))) e.alternate_phone = "Enter a valid mobile number (01XXXXXXXXX).";
    if (form.email.trim() && !EMAIL.test(form.email.trim())) e.email = "Enter a valid email address.";
    if (tradeLicense.length === 0) e.trade_license = "Attach the trade licence (up to 3 files).";
    if (nidFront.length === 0) e.nid_front = "Attach the front of the NID.";
    if (nidBack.length === 0) e.nid_back = "Attach the back of the NID.";
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      setError("Please fix the highlighted fields.");
      return;
    }

    const fd = new FormData();
    fd.append("business_name", form.business_name.trim());
    fd.append("business_type", form.business_type);
    fd.append("trade_license_number", form.trade_license_number.trim());
    if (form.bin_tin.trim()) fd.append("bin_tin", form.bin_tin.trim());
    fd.append("business_address", form.business_address.trim());
    fd.append("district_id", form.district_id);
    if (form.interested_in.trim()) fd.append("interested_in", form.interested_in.trim());
    fd.append("contact_name", form.contact_name.trim());
    if (form.designation.trim()) fd.append("designation", form.designation.trim());
    fd.append("phone", cleanPhone(form.phone));
    if (form.email.trim()) fd.append("email", form.email.trim());
    if (form.alternate_phone.trim()) fd.append("alternate_phone", cleanPhone(form.alternate_phone));
    if (form.message.trim()) fd.append("message", form.message.trim());
    tradeLicense.forEach((f) => fd.append("trade_license[]", f));
    fd.append("nid_front", nidFront[0]);
    fd.append("nid_back", nidBack[0]);
    // Spam trap: real visitors never fill it in.
    if (form.website) fd.append("website", form.website);

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/business-applications", { method: "POST", body: fd });
      const body = (await res.json().catch(() => null)) as
        | { data?: { message?: string }; message?: string; errors?: Record<string, string[]> }
        | null;
      if (!res.ok) {
        // `trade_license.0` style keys belong to the trade licence picker.
        const fieldErrors: FieldErrors = {};
        for (const [k, msgs] of Object.entries(body?.errors ?? {})) {
          const key = k.startsWith("trade_license") ? "trade_license" : k.split(".")[0];
          if (!fieldErrors[key] && msgs?.[0]) fieldErrors[key] = msgs[0];
        }
        setErrors(fieldErrors);
        setError(body?.message || "We could not send your application. Please try again.");
        return;
      }
      setDone(body?.data?.message || "Thank you. We have received your application and will be in touch.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Application received</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      )}

      <fieldset className="space-y-4">
        <legend className="text-base font-bold text-slate-900 mb-1">Business details</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="b-name">Business name</Label>
            <input id="b-name" value={form.business_name} onChange={set("business_name")} maxLength={255} aria-invalid={!!errors.business_name} className={input} />
            <FieldError message={errors.business_name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-type">Type of business</Label>
            <select id="b-type" value={form.business_type} onChange={set("business_type")} className={input}>
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.business_type} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-license">Trade licence number</Label>
            <input
              id="b-license"
              value={form.trade_license_number}
              onChange={set("trade_license_number")}
              maxLength={100}
              aria-invalid={!!errors.trade_license_number}
              className={input}
            />
            <FieldError message={errors.trade_license_number} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-bin" optional>
              BIN / TIN
            </Label>
            <input id="b-bin" value={form.bin_tin} onChange={set("bin_tin")} maxLength={50} aria-invalid={!!errors.bin_tin} className={input} />
            <FieldError message={errors.bin_tin} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-district">District</Label>
            <select id="b-district" value={form.district_id} onChange={set("district_id")} aria-invalid={!!errors.district_id} className={input}>
              <option value="">Choose a district</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.district_id} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="b-address">Business address</Label>
            <input
              id="b-address"
              value={form.business_address}
              onChange={set("business_address")}
              maxLength={500}
              aria-invalid={!!errors.business_address}
              className={input}
            />
            <FieldError message={errors.business_address} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="b-interest" optional>
              What would you like to buy?
            </Label>
            <textarea
              id="b-interest"
              value={form.interested_in}
              onChange={set("interested_in")}
              rows={3}
              maxLength={2000}
              placeholder="e.g. Fire extinguishers, about 50 a month"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-bold text-slate-900 mb-1">Contact person</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="b-contact">Name</Label>
            <input id="b-contact" value={form.contact_name} onChange={set("contact_name")} autoComplete="name" maxLength={255} aria-invalid={!!errors.contact_name} className={input} />
            <FieldError message={errors.contact_name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-designation" optional>
              Designation
            </Label>
            <input id="b-designation" value={form.designation} onChange={set("designation")} maxLength={100} placeholder="e.g. Proprietor" className={input} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-phone">Mobile number</Label>
            <input
              id="b-phone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              aria-invalid={!!errors.phone}
              className={input}
            />
            <FieldError message={errors.phone} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-alt-phone" optional>
              Alternate mobile number
            </Label>
            <input
              id="b-alt-phone"
              type="tel"
              value={form.alternate_phone}
              onChange={set("alternate_phone")}
              placeholder="01XXXXXXXXX"
              aria-invalid={!!errors.alternate_phone}
              className={input}
            />
            <FieldError message={errors.alternate_phone} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="b-email" optional>
              Email
            </Label>
            <input id="b-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" maxLength={255} aria-invalid={!!errors.email} className={input} />
            <FieldError message={errors.email} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-bold text-slate-900 mb-1">Documents</legend>
        <p className="text-sm text-slate-500 -mt-2">Used only to verify your business. They are kept privately and never shared.</p>
        <div className="space-y-1.5">
          <Label htmlFor="b-trade-file">Trade licence (up to 3 files)</Label>
          <FilePicker id="b-trade-file" files={tradeLicense} multiple max={3} onChange={setTradeLicense} error={errors.trade_license} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="b-nid-front">NID, front</Label>
            <FilePicker id="b-nid-front" files={nidFront} onChange={setNidFront} error={errors.nid_front} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-nid-back">NID, back</Label>
            <FilePicker id="b-nid-back" files={nidBack} onChange={setNidBack} error={errors.nid_back} />
          </div>
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="b-message" optional>
          Anything else?
        </Label>
        <textarea
          id="b-message"
          value={form.message}
          onChange={set("message")}
          rows={4}
          maxLength={2000}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      {/* Spam trap: hidden from people, filled in by bots. */}
      <div aria-hidden="true" className="absolute -left-[10000px] w-px h-px overflow-hidden">
        <label htmlFor="b-website">Website</label>
        <input id="b-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold disabled:opacity-60 transition-colors"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {busy ? "Sending your application…" : "Send application"}
      </button>
    </form>
  );
}
