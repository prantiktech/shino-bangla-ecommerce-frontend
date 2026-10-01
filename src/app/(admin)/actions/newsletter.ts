"use server";

import { adminList, adminRequest, adminVoid, QueryParams } from "./_request";

export interface Subscriber {
  id: number;
  email: string;
  source: string | null;
  is_subscribed: boolean;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
}

export interface Campaign {
  id: number;
  subject: string;
  body: string;
  status: "draft" | "scheduled" | "sending" | "sent" | string;
  recipient_count: number;
  sent_count: number;
  scheduled_at: string | null;
  sent_at: string | null;
  author?: string | null;
  created_at: string;
}

export interface CampaignPayload {
  subject?: string;
  body?: string;
  scheduled_at?: string | null;
}

/** GET /admin/newsletter/subscribers (`subscribed`, `q`) */
export async function getAdminSubscribersAction(params?: QueryParams) {
  return adminList<Subscriber>("GET_ADMIN_NEWSLETTER_SUBSCRIBERS", "Failed to load subscribers", params);
}

export async function getAdminCampaignsAction(params?: QueryParams) {
  return adminList<Campaign>("GET_ADMIN_NEWSLETTER_CAMPAIGNS", "Failed to load campaigns", params);
}

export async function getAdminCampaignAction(id: number) {
  return adminRequest<Campaign>("GET", "GET_ADMIN_NEWSLETTER_CAMPAIGN", "Failed to load campaign", {
    pathParams: { id },
  });
}

export async function createAdminCampaignAction(payload: CampaignPayload) {
  return adminRequest<Campaign>("POST", "CREATE_ADMIN_NEWSLETTER_CAMPAIGN", "Failed to create campaign", {
    body: payload,
  });
}

/** Only campaigns that have not gone out can be edited. */
export async function updateAdminCampaignAction(id: number, payload: CampaignPayload) {
  return adminRequest<Campaign>("PUT", "UPDATE_ADMIN_NEWSLETTER_CAMPAIGN", "Failed to update campaign", {
    pathParams: { id },
    body: payload,
  });
}

export async function deleteAdminCampaignAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_NEWSLETTER_CAMPAIGN", "Failed to delete campaign", { pathParams: { id } });
}

/** POST /admin/newsletter/campaigns/{id}/send — queued, sent in chunks */
export async function sendAdminCampaignAction(id: number) {
  return adminRequest<Campaign>("POST", "SEND_ADMIN_NEWSLETTER_CAMPAIGN", "Failed to send campaign", {
    pathParams: { id },
  });
}
