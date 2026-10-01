"use server";

import { adminRequest, adminVoid } from "./_request";

export interface HomeSectionType {
  type: string;
  default_title: string;
  picks_items: boolean;
  needs_category: boolean;
  shows_products: boolean;
}

export interface HomeSectionSettings {
  limit?: number;
  category_id?: number;
  mode?: "latest" | "best_selling" | "popular" | "rating" | "discounted";
}

export interface HomeSection {
  id: number;
  type: string;
  title: string | null;
  heading: string | null;
  subtitle: string | null;
  is_active: boolean;
  position: number;
  settings: HomeSectionSettings | null;
  starts_at: string | null;
  ends_at: string | null;
  picks_items: boolean;
  item_ids: number[];
}

export interface HomeSectionPayload {
  type?: string;
  title?: string | null;
  subtitle?: string | null;
  is_active?: boolean;
  position?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  settings?: HomeSectionSettings | null;
  item_ids?: number[];
}

export async function getAdminHomeSectionsAction() {
  return adminRequest<HomeSection[]>("GET", "GET_ADMIN_HOME_SECTIONS", "Failed to load home sections");
}

export async function getAdminHomeSectionTypesAction() {
  return adminRequest<HomeSectionType[]>("GET", "GET_ADMIN_HOME_SECTION_TYPES", "Failed to load section types");
}

export async function getAdminHomeSectionAction(id: number) {
  return adminRequest<HomeSection>("GET", "GET_ADMIN_HOME_SECTION", "Failed to load section", { pathParams: { id } });
}

export async function createAdminHomeSectionAction(payload: HomeSectionPayload) {
  return adminRequest<HomeSection>("POST", "CREATE_ADMIN_HOME_SECTION", "Failed to add section", { body: payload });
}

/** PUT /admin/home-sections/{id} — sending `item_ids` replaces its contents */
export async function updateAdminHomeSectionAction(id: number, payload: HomeSectionPayload) {
  return adminRequest<HomeSection>("PUT", "UPDATE_ADMIN_HOME_SECTION", "Failed to update section", {
    pathParams: { id },
    body: payload,
  });
}

/** PUT /admin/home-sections/reorder */
export async function reorderAdminHomeSectionsAction(ids: number[]) {
  return adminRequest<HomeSection[]>("PUT", "REORDER_ADMIN_HOME_SECTIONS", "Failed to reorder sections", {
    body: { ids },
  });
}

export async function deleteAdminHomeSectionAction(id: number) {
  return adminVoid("DELETE", "DELETE_ADMIN_HOME_SECTION", "Failed to remove section", { pathParams: { id } });
}
