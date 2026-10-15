import React from "react";
import { getSettingsAction } from "@/app/(user)/actions/settings";
import { ContactLauncherButton, type ContactChannels } from "./ContactLauncherButton";

/**
 * Floating "contact us" button with WhatsApp and Messenger.
 *
 * WhatsApp uses NEXT_PUBLIC_WHATSAPP_NUMBER, or the store phone from settings when that is a mobile number.
 * Messenger uses NEXT_PUBLIC_MESSENGER_URL (e.g. https://m.me/yourpage).
 * With neither available nothing is rendered.
 */

/** "+880 1712-345678" / "01712345678" → "8801712345678" (the international form wa.me expects). */
function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (/^01[3-9]\d{8}$/.test(digits)) return `88${digits}`;
  if (/^8801[3-9]\d{8}$/.test(digits)) return digits;
  // Other countries: accept a plausible full international number given in the env variable.
  if (/^\d{10,15}$/.test(digits) && raw.trim().startsWith("+")) return digits;
  return null;
}

/** Only links that really open Messenger or a Facebook page. */
function toMessengerUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, "");
    return url.protocol === "https:" && ["m.me", "messenger.com", "facebook.com", "fb.com"].includes(host) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function ContactLauncher() {
  const settings = await getSettingsAction();
  const storeName = settings.success ? settings.data.store_name : undefined;
  const channels: ContactChannels = {
    whatsapp: toWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) ?? toWhatsAppNumber(settings.success ? settings.data.store_phone : null),
    messenger: toMessengerUrl(process.env.NEXT_PUBLIC_MESSENGER_URL),
  };
  if (!channels.whatsapp && !channels.messenger) return null;
  return <ContactLauncherButton channels={channels} storeName={storeName || "us"} />;
}
