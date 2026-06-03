"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ScanLine,
  Camera,
  CameraOff,
  Plus,
  Minus,
  Trash2,
  Loader2,
  CheckCircle2,
  ShoppingCart,
  AlertCircle,
  X,
} from "lucide-react";
import { lookupBarcode, posCheckout } from "@/app/(app)/pos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatBDT } from "@/lib/format";

type Warehouse = { id: string; name: string };
type CartLine = {
  variantId: string;
  name: string;
  detail: string;
  sku: string;
  price: number;
  qty: number;
  available: number;
};

function beep(ok: boolean) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = ok ? 880 : 220;
    gain.gain.value = 0.05;
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
    osc.onended = () => ctx.close();
  } catch {}
}

export function PosTerminal({ warehouses }: { warehouses: Warehouse[] }) {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<{ orderId: string; orderNumber: string; total: number } | null>(null);

  const scanRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastScan = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const focusScan = useCallback(() => {
    setTimeout(() => scanRef.current?.focus(), 30);
  }, []);

  const flash = useCallback((tone: "error" | "info", text: string) => {
    setMessage({ tone, text });
    setTimeout(() => setMessage(null), 2600);
  }, []);

  const addByCode = useCallback(
    async (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      // Debounce repeated camera reads of the same code
      const now = Date.now();
      if (lastScan.current.code === code && now - lastScan.current.at < 1200)
        return;
      lastScan.current = { code, at: now };

      const res = await lookupBarcode(code, warehouseId);
      if (!res.found) {
        beep(false);
        flash("error", res.error);
        return;
      }
      setCart((prev) => {
        const existing = prev.find((l) => l.variantId === res.variantId);
        if (existing) {
          if (existing.qty >= res.available) {
            beep(false);
            flash("error", `Only ${res.available} in stock for ${res.productName}.`);
            return prev;
          }
          beep(true);
          return prev.map((l) =>
            l.variantId === res.variantId ? { ...l, qty: l.qty + 1 } : l,
          );
        }
        if (res.available < 1) {
          beep(false);
          flash("error", `${res.productName} is out of stock here.`);
          return prev;
        }
        beep(true);
        return [
          {
            variantId: res.variantId,
            name: res.productName,
            detail: res.detail,
            sku: res.sku,
            price: res.price,
            qty: 1,
            available: res.available,
          },
          ...prev,
        ];
      });
    },
    [warehouseId, flash],
  );

  async function startCamera() {
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      setCameraOn(true);
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result) => {
          if (result) addByCode(result.getText());
        },
      );
      controlsRef.current = controls;
    } catch {
      setCameraOn(false);
      flash("error", "Could not access the camera. Check permissions.");
    }
  }

  function stopCamera() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraOn(false);
    focusScan();
  }

  // Stop camera on unmount
  useEffect(() => () => controlsRef.current?.stop(), []);
  // Keep the scan field focused on mount
  useEffect(() => focusScan(), [focusScan]);

  function changeQty(variantId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.variantId !== variantId) return l;
          const next = l.qty + delta;
          if (next > l.available) {
            flash("error", `Only ${l.available} in stock.`);
            return l;
          }
          return { ...l, qty: next };
        })
        .filter((l) => l.qty > 0),
    );
  }

  function removeLine(variantId: string) {
    setCart((prev) => prev.filter((l) => l.variantId !== variantId));
  }

  const subtotal = cart.reduce((s, l) => s + l.qty * l.price, 0);
  const total = Math.max(0, subtotal - discount);
  const itemCount = cart.reduce((s, l) => s + l.qty, 0);

  async function checkout() {
    if (cart.length === 0) return;
    setPending(true);
    const res = await posCheckout({
      items: cart.map((l) => ({ variantId: l.variantId, quantity: l.qty, price: l.price })),
      warehouseId,
      discount,
    });
    setPending(false);
    if (res.ok && res.orderId) {
      beep(true);
      setDone({ orderId: res.orderId, orderNumber: res.orderNumber!, total });
      setCart([]);
      setDiscount(0);
    } else {
      beep(false);
      flash("error", res.error ?? "Checkout failed.");
    }
  }

  function newSale() {
    setDone(null);
    focusScan();
  }

  // Success screen
  if (done) {
    return (
      <Card className="mx-auto max-w-md animate-scale-in">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-9" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold">Sale complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {done.orderNumber} · {formatBDT(done.total)}
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="gold" onClick={newSale}>
              <ScanLine className="size-4" /> New sale
            </Button>
            <Button asChild variant="outline">
              <Link href={`/sales/${done.orderId}`}>View invoice</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
    {/* Mobile sticky checkout bar */}
    {cart.length > 0 && (
      <div className="fixed bottom-14 left-0 right-0 z-20 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
          <p className="text-xs text-muted-foreground">{formatBDT(total)}</p>
        </div>
        <Button variant="gold" size="sm" onClick={checkout} disabled={pending || cart.length === 0}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Complete sale →"}
        </Button>
      </div>
    )}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Scanner */}
      <div className="space-y-4 lg:col-span-3">
        {message && (
          <div
            role="alert"
            className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm ${
              message.tone === "error"
                ? "border-destructive/25 bg-destructive/10 text-destructive"
                : "border-info/25 bg-info/10 text-info"
            }`}
          >
            <AlertCircle className="size-4 shrink-0" />
            {message.text}
          </div>
        )}

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium">
                  Scan or type barcode / SKU
                </label>
                <div className="relative">
                  <ScanLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent" />
                  <Input
                    ref={scanRef}
                    autoFocus
                    placeholder="Point scanner here, or type a code + Enter"
                    className="pl-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const v = (e.target as HTMLInputElement).value;
                        addByCode(v);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant={cameraOn ? "secondary" : "outline"}
                onClick={cameraOn ? stopCamera : startCamera}
              >
                {cameraOn ? (
                  <>
                    <CameraOff className="size-4" /> Stop camera
                  </>
                ) : (
                  <>
                    <Camera className="size-4" /> Use camera
                  </>
                )}
              </Button>
            </div>

            {cameraOn && (
              <div className="relative overflow-hidden rounded-lg border border-border bg-black">
                <video
                  ref={videoRef}
                  className="aspect-video w-full object-cover"
                  muted
                  playsInline
                />
                <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-accent/80 shadow-[0_0_12px_var(--accent)]" />
                <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                  Point the barcode at the camera
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Tip: a USB/Bluetooth scanner works automatically — it types the
              code and presses Enter. The camera is for phones/laptops.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cart */}
      <div className="lg:col-span-2">
        <Card className="lg:sticky lg:top-20">
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Cart</h2>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShoppingCart className="size-4" /> {itemCount}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                <ScanLine className="size-8 opacity-40" />
                <p className="mt-2 text-sm">Scan a product to begin.</p>
              </div>
            ) : (
              <ul className="-mx-2 max-h-[42vh] space-y-1 overflow-y-auto px-2">
                {cart.map((l) => (
                  <li
                    key={l.variantId}
                    className="flex items-center gap-2 rounded-md py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {l.detail} · {formatBDT(l.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => changeQty(l.variantId, -1)}
                        className="grid size-7 place-items-center rounded border border-border hover:bg-muted cursor-pointer"
                        aria-label="Decrease"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="tabular w-6 text-center text-sm">{l.qty}</span>
                      <button
                        onClick={() => changeQty(l.variantId, 1)}
                        className="grid size-7 place-items-center rounded border border-border hover:bg-muted cursor-pointer"
                        aria-label="Increase"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="tabular w-20 text-right text-sm font-medium">
                      {formatBDT(l.qty * l.price)}
                    </span>
                    <button
                      onClick={() => removeLine(l.variantId)}
                      className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                      aria-label="Remove"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="hairline mt-3 space-y-2 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Warehouse</span>
                <Select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="h-8 w-40 text-xs"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Discount (৳)</span>
                <Input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="tabular h-8 w-28 text-right"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular">{formatBDT(subtotal)}</span>
              </div>
              <div className="hairline flex justify-between pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular text-accent">{formatBDT(total)}</span>
              </div>
            </div>

            <Button
              variant="gold"
              size="lg"
              className="mt-4 w-full"
              disabled={cart.length === 0 || pending}
              onClick={checkout}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Completing…
                </>
              ) : (
                <>Complete sale · {formatBDT(total)}</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
