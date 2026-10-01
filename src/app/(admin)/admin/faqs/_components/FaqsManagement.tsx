"use client";

import React, { useMemo, useState } from "react";
import { Edit2, HelpCircle, Plus, Trash2 } from "lucide-react";
import {
  AdminFaq,
  createAdminFaqAction,
  deleteAdminFaqAction,
  getAdminFaqsAction,
  updateAdminFaqAction,
} from "@/app/(admin)/actions/content";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  HtmlEditor,
  IconButton,
  InlineError,
  Input,
  Modal,
  NoticeBanner,
  PageHeader,
  Toggle,
  useNotice,
} from "@/app/(admin)/components/ui";

interface FormState {
  question: string;
  answer: string;
  group: string;
  position: string;
  is_active: boolean;
}

export function FaqsManagement({ initial, initialError }: { initial: AdminFaq[]; initialError: string | null }) {
  const [faqs, setFaqs] = useState(initial);
  const { notice, success, error, clear } = useNotice();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminFaq | null>(null);
  const [form, setForm] = useState<FormState>({ question: "", answer: "", group: "", position: "0", is_active: true });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AdminFaq | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const groups = useMemo(() => {
    const m = new Map<string, AdminFaq[]>();
    for (const f of [...faqs].sort((a, b) => a.position - b.position)) {
      const g = f.group || "General";
      m.set(g, [...(m.get(g) ?? []), f]);
    }
    return [...m.entries()];
  }, [faqs]);
  const groupNames = useMemo(() => [...new Set(faqs.map((f) => f.group).filter(Boolean))] as string[], [faqs]);

  const reload = async () => {
    const res = await getAdminFaqsAction();
    if (res.success) setFaqs(res.data ?? []);
  };
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = (group = "") => {
    setEditing(null);
    setForm({ question: "", answer: "", group, position: String(faqs.filter((f) => (f.group || "") === group).length), is_active: true });
    setFormError(null);
    setFormOpen(true);
  };
  const openEdit = (f: AdminFaq) => {
    setEditing(f);
    setForm({ question: f.question, answer: f.answer, group: f.group ?? "", position: String(f.position), is_active: f.is_active });
    setFormError(null);
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.question.trim()) return setFormError("Enter the question.");
    if (!form.answer.trim()) return setFormError("Enter the answer.");
    setSaving(true);
    setFormError(null);
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      group: form.group.trim() || null,
      position: Math.max(0, Number(form.position) || 0),
      is_active: form.is_active,
    };
    const res = editing ? await updateAdminFaqAction(editing.id, payload) : await createAdminFaqAction(payload);
    setSaving(false);
    if (!res.success) return setFormError(res.error.message);
    setFormOpen(false);
    success(editing ? "FAQ saved." : "FAQ added.");
    reload();
  };

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await deleteAdminFaqAction(deleting.id);
    setDeleteBusy(false);
    if (!res.success) error(res.error.message);
    else {
      success("FAQ deleted.");
      reload();
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        icon={HelpCircle}
        title="FAQs"
        description="Questions and answers shown to customers, grouped by topic."
        actions={<Button icon={Plus} onClick={() => openCreate()}>Add question</Button>}
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      {faqs.length === 0 ? (
        <Card>
          <EmptyState
            icon={HelpCircle}
            title="No FAQs yet"
            description="Answer common questions about delivery, payment and returns."
            action={<Button icon={Plus} onClick={() => openCreate()}>Add question</Button>}
          />
        </Card>
      ) : (
        groups.map(([group, items]) => (
          <section key={group} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">{group}</h2>
              <Button size="sm" variant="ghost" icon={Plus} onClick={() => openCreate(group === "General" ? "" : group)}>
                Add to {group}
              </Button>
            </div>
            <Card padded={false}>
              <ul className="divide-y divide-slate-100">
                {items.map((f) => (
                  <li key={f.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{f.question}</p>
                        {!f.is_active && <Badge tone="slate">Hidden</Badge>}
                      </div>
                      <div className="cms-content text-sm text-slate-600 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: f.answer }} />
                    </div>
                    <span className="inline-flex gap-1 shrink-0">
                      <IconButton label="Edit FAQ" icon={Edit2} tone="primary" onClick={() => openEdit(f)} />
                      <IconButton label="Delete FAQ" icon={Trash2} tone="danger" onClick={() => setDeleting(f)} />
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit question" : "Add question"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save}>
              {editing ? "Save" : "Add question"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <InlineError message={formError} />
          <Field label="Question" required>
            <Input value={form.question} onChange={(e) => set("question", e.target.value)} maxLength={500} autoFocus />
          </Field>
          <Field label="Answer" required>
            <HtmlEditor value={form.answer} onChange={(v) => set("answer", v)} rows={8} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Topic" hint="e.g. Delivery, Payment, Returns">
              <Input value={form.group} onChange={(e) => set("group", e.target.value)} list="faq-groups" maxLength={64} />
              <datalist id="faq-groups">
                {groupNames.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </Field>
            <Field label="Position" hint="Lower numbers appear first.">
              <Input type="number" min={0} max={1000} value={form.position} onChange={(e) => set("position", e.target.value)} />
            </Field>
          </div>
          <Toggle checked={form.is_active} onChange={(v) => set("is_active", v)} label="Visible to customers" />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete question?"
        message={deleting?.question}
        confirmLabel="Delete"
        loading={deleteBusy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
