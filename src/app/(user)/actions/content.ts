"use server";

import { serverGet, serverPost } from "@/lib/api-client/server";
import { ActionResponse, handleActionError } from "@/lib/api-client/status-handler";

export interface PageListItem {
  slug: string;
  title: string;
}

export interface PageDetail {
  slug: string;
  title: string;
  content: string;
  seo_title?: string | null;
  seo_description?: string | null;
  updated_at?: string;
}

export interface FaqItem {
  id?: number;
  question: string;
  answer: string;
  category?: string;
  sort_order?: number;
}

export interface SitemapResult {
  type: string;
  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
  items: Array<{
    slug: string;
    updated_at: string;
  }>;
}

export interface ContactPayload {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  website?: string; // Honeypot spam trap: must be empty
}

/**
 * Fetch published static pages for footer and navigation.
 * GET /api/v1/pages
 */
export async function getPagesAction(): Promise<ActionResponse<PageListItem[]>> {
  try {
    const res = await serverGet<any>("GET_PAGES");
    if (res.success && res.data) {
      const list = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: list };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load pages") : "Failed to load pages",
        code: "GET_PAGES_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Fetch a single page by slug with full HTML content.
 * GET /api/v1/pages/{slug}
 */
export async function getPageBySlugAction(slug: string): Promise<ActionResponse<PageDetail>> {
  try {
    const res = await serverGet<any>("GET_PAGE", {
      pathParams: { slug: slug.trim() },
    });
    if (res.success && res.data) {
      const page = res.data.data || res.data;
      return { success: true, data: page };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Page not found") : "Page not found",
        code: "PAGE_NOT_FOUND",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Fetch published frequently asked questions.
 * GET /api/v1/faqs
 */
export async function getFaqsAction(): Promise<ActionResponse<FaqItem[]>> {
  try {
    const res = await serverGet<any>("GET_FAQS");
    if (res.success && res.data) {
      const list = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      return { success: true, data: list };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to load FAQs") : "Failed to load FAQs",
        code: "GET_FAQS_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Fetch slugs for sitemap generation.
 * GET /api/v1/sitemap?type={products|categories|brands|pages}
 */
export async function getSitemapAction(
  type?: "products" | "categories" | "brands" | "pages" | string
): Promise<ActionResponse<SitemapResult>> {
  try {
    const res = await serverGet<any>("GET_SITEMAP", {
      params: type ? { type } : undefined,
    });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to fetch sitemap") : "Failed to fetch sitemap",
        code: "GET_SITEMAP_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Send a contact inquiry to the shop.
 * POST /api/v1/contact
 */
export async function submitContactAction(
  payload: ContactPayload
): Promise<ActionResponse<{ id: number; message: string }>> {
  try {
    // Check spam honeypot
    if (payload.website && payload.website.trim().length > 0) {
      return {
        success: false,
        error: {
          message: "Spam submission rejected",
          code: "SPAM_REJECTED",
        },
      };
    }

    const body: Record<string, any> = {
      name: payload.name.trim(),
      message: payload.message.trim(),
    };
    if (payload.email) body.email = payload.email.trim();
    if (payload.phone) body.phone = payload.phone.trim();
    if (payload.subject) body.subject = payload.subject.trim();

    const res = await serverPost<any>("CONTACT_SUBMIT", body);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to send message") : "Failed to send message",
        code: "CONTACT_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Subscribe email to the newsletter.
 * POST /api/v1/newsletter/subscribe
 */
export async function subscribeNewsletterAction(
  email: string,
  source: "footer" | "popup" | "checkout" = "footer",
  websiteTrap?: string
): Promise<ActionResponse<{ message: string }>> {
  try {
    if (websiteTrap && websiteTrap.trim().length > 0) {
      return {
        success: false,
        error: {
          message: "Spam submission rejected",
          code: "SPAM_REJECTED",
        },
      };
    }

    const body: Record<string, any> = {
      email: email.trim().toLowerCase(),
      source,
    };

    const res = await serverPost<any>("NEWSLETTER_SUBSCRIBE", body);
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to subscribe") : "Failed to subscribe",
        code: "SUBSCRIBE_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Unsubscribe email from newsletter using token.
 * POST /api/v1/newsletter/unsubscribe
 */
export async function unsubscribeNewsletterAction(
  token: string
): Promise<ActionResponse<{ message: string }>> {
  try {
    const res = await serverPost<any>("NEWSLETTER_UNSUBSCRIBE", { token: token.trim() });
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: !res.success ? (res.error?.message || "Failed to unsubscribe") : "Failed to unsubscribe",
        code: "UNSUBSCRIBE_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Check backend health status.
 * GET /api/v1/health
 */
export async function getHealthAction(): Promise<ActionResponse<{ status: string; timestamp?: string }>> {
  try {
    const res = await serverGet<any>("GET_HEALTH");
    if (res.success && res.data) {
      return { success: true, data: res.data.data || res.data };
    }
    return {
      success: false,
      error: {
        message: "Health check failed",
        code: "HEALTH_CHECK_FAILED",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
