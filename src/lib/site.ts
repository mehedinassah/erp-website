/** Central place for site-wide constants: URLs, contact info, social links. */

export const SITE_URL = "https://perico-erp.vercel.app";

export const SITE = {
  name: "PERICO",
  url: SITE_URL,
  description:
    "PERICO is an all-in-one cloud ERP for shops and wholesalers: inventory, barcode POS, sales, purchasing, and Dena-Paona ledger. Works on phone and computer.",
} as const;

const WHATSAPP_DIGITS = "8801919234860"; // +880 1919 234860

export const CONTACT = {
  email: "mehedinas69@gmail.com",
  whatsappDisplay: "+880 1919-234860",
  whatsappUrl: `https://wa.me/${WHATSAPP_DIGITS}`,
  facebookUrl: "https://www.facebook.com/mandi.mandihassan",
} as const;

/** Where customers send manual subscription payments (bKash / Nagad). */
export const BILLING = {
  bkash: "01919234860",
  nagad: "01919234860",
} as const;
