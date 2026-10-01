"use server";

import { adminList, adminRequest, adminVoid, QueryParams } from "./_request";

export interface AdminPage {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
}

export interface AdminPagePayload {
  title?: string;
  slug?: string;
  content?: string | null;
  is_active?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface AdminFaq {
  id: number;
  question: string;
  answer: string;
  group: string | null;
  is_active: boolean;
  position: number;
}

export interface AdminFaqPayload {
  question?: string;
  answer?: string;
  group?: string | null;
  is_active?: boolean;
  position?: number;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  replied_at: string | null;
  customer: { id: number; name: string } | null;
  created_at: string;
}

/* ---------------- Pages ---------------- */

export async function getAdminPagesAction() {
  return adminRequest<AdminPage[]>("GET", "GET_ADMIN_PAGES", "Failed to load pages");
}

export async function getAdminPageAction(id: number) {
  return adminRequest<AdminPage>("GET", "GET_ADMIN_PAGE", "Failed to load page", { pathParams: { id } });
}

export async function createAdminPageAction(payload: AdminPagePayload) {
  return adminRequest<AdminPage>("POST", "CREATE_ADMIN_PAGE", "Failed to create page", { body: payload });
}

export async function updateAdminPageAction(id: number, payload: AdminPagePayload) {
  return adminRequest<AdminPage>("PUT", "UPDATE_ADMIN_PAGE", "Failed to update page", {
    pathParams: { id },
    body: payload,
  });
}

export async function deleteAdminPageAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_PAGE", "Failed to delete page", { pathParams: { id } });
}

/* ---------------- FAQs ---------------- */

export async function getAdminFaqsAction(group?: string) {
  return adminRequest<AdminFaq[]>("GET", "GET_ADMIN_FAQS", "Failed to load FAQs", { params: { group } });
}

export async function createAdminFaqAction(payload: AdminFaqPayload) {
  return adminRequest<AdminFaq>("POST", "CREATE_ADMIN_FAQ", "Failed to create FAQ", { body: payload });
}

export async function updateAdminFaqAction(id: number, payload: AdminFaqPayload) {
  return adminRequest<AdminFaq>("PUT", "UPDATE_ADMIN_FAQ", "Failed to update FAQ", {
    pathParams: { id },
    body: payload,
  });
}

export async function deleteAdminFaqAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_FAQ", "Failed to delete FAQ", { pathParams: { id } });
}

/* ---------------- Contact inbox ---------------- */

/** GET /admin/contact-messages (`unread=1`, `q`) */
export async function getAdminMessagesAction(params?: QueryParams) {
  return adminList<ContactMessage>("GET_ADMIN_MESSAGES", "Failed to load messages", params);
}

/** GET /admin/contact-messages/{id} — opening a message marks it read */
export async function getAdminMessageAction(id: number) {
  return adminRequest<ContactMessage>("GET", "GET_ADMIN_MESSAGE", "Failed to load message", { pathParams: { id } });
}

export async function markAdminMessageRepliedAction(id: number) {
  return adminRequest<ContactMessage>("POST", "REPLY_ADMIN_MESSAGE", "Failed to mark as replied", {
    pathParams: { id },
  });
}

export async function deleteAdminMessageAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_MESSAGE", "Failed to delete message", { pathParams: { id } });
}
