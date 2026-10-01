"use client";

import React, { useState } from "react";
import { Check, Edit2, Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import {
  OptionType,
  createAdminOptionTypeAction,
  deleteAdminOptionTypeAction,
  getAdminOptionTypesAction,
  updateAdminOptionTypeAction,
} from "@/app/(admin)/actions/option-types";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  NoticeBanner,
  PageHeader,
  useNotice,
} from "@/app/(admin)/components/ui";

export function OptionTypesManagement({ initial, initialError }: { initial: OptionType[]; initialError: string | null }) {
  const [items, setItems] = useState(initial);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<OptionType | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const { notice, success, error, clear } = useNotice();

  const reload = async () => {
    const res = await getAdminOptionTypesAction();
    if (res.success) setItems(res.data ?? []);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const res = await createAdminOptionTypeAction(newName);
    setAdding(false);
    if (!res.success) return error(res.error.message);
    setNewName("");
    success(`Option "${res.data.name}" added.`);
    reload();
  };

  const rename = async (id: number) => {
    if (!editName.trim()) return;
    setSavingId(id);
    const res = await updateAdminOptionTypeAction(id, editName);
    setSavingId(null);
    if (!res.success) return error(res.error.message);
    setEditId(null);
    success("Option renamed.");
    reload();
  };

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await deleteAdminOptionTypeAction(deleting.id);
    setDeleteBusy(false);
    if (!res.success) error(res.error.message);
    else {
      success(`Option "${deleting.name}" deleted.`);
      reload();
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        icon={SlidersHorizontal}
        title="Product options"
        description="Variant dimensions such as Size, Weight or Volume. Each product can vary by one option."
      />
      <NoticeBanner notice={notice ?? (initialError ? { type: "error", message: initialError } : null)} onClose={clear} />

      <Card>
        <form onSubmit={add} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New option name, e.g. Length"
            maxLength={64}
            aria-label="New option name"
          />
          <Button type="submit" icon={Plus} loading={adding} disabled={!newName.trim()}>
            Add option
          </Button>
        </form>
      </Card>

      <Card padded={false}>
        {items.length === 0 ? (
          <EmptyState icon={SlidersHorizontal} title="No options yet" description="Add an option to create products with variants." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                {editId === o.id ? (
                  <form
                    className="flex flex-1 items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      rename(o.id);
                    }}
                  >
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={64} autoFocus aria-label="Option name" />
                    <IconButton label="Save" icon={Check} tone="primary" type="submit" disabled={savingId === o.id} />
                    <IconButton label="Cancel" icon={X} onClick={() => setEditId(null)} />
                  </form>
                ) : (
                  <>
                    <span className="text-sm font-medium text-slate-800">{o.name}</span>
                    <span className="inline-flex gap-1">
                      <IconButton
                        label="Rename"
                        icon={Edit2}
                        tone="primary"
                        onClick={() => {
                          setEditId(o.id);
                          setEditName(o.name);
                        }}
                      />
                      <IconButton label="Delete" icon={Trash2} tone="danger" onClick={() => setDeleting(o)} />
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleting}
        title="Delete option?"
        message={<>Delete <strong className="text-slate-900">{deleting?.name}</strong>? Options used by any product cannot be deleted.</>}
        confirmLabel="Delete"
        loading={deleteBusy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
