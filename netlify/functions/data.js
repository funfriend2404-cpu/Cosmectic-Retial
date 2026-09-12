// Netlify Function (v2, ESM) backing the Makara Cosmectic POS cloud sync.
// Stores one JSON blob per site containing { products, sales, settings, stockLog }.
// Every device that opens the site reads/writes this same blob, so
// inventory, sales, settings (QR code, low-stock threshold) and the
// stock adjustment log all stay in sync automatically.

import { getStore } from "@netlify/blobs";

const KEY = "state";
const STORE_NAME = "makara-pos";

export default async (req) => {
  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    const data = await store.get(KEY, { type: "json" });
    return new Response(JSON.stringify(data || {}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { products, sales, settings, stockLog } = body || {};
    await store.setJSON(KEY, {
      products: Array.isArray(products) ? products : [],
      sales: Array.isArray(sales) ? sales : [],
      settings: settings && typeof settings === "object" ? settings : {},
      stockLog: Array.isArray(stockLog) ? stockLog : [],
      updatedAt: new Date().toISOString(),
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = {
  path: "/.netlify/functions/data",
};
