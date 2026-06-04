"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Menu, X, LogOut, ChevronsUpDown, Search,
  LayoutDashboard, Package, ScanLine, Moon, Sun, Shield, UserCircle,
} from "lucide-react";
import Image from "next/image";
import { NAV } from "./nav-config";
import { ThemeToggle } from "./theme-toggle";
import { logoutAction } from "@/app/(app)/account-actions";
import { ROLE_LABEL, type Role } from "@/lib/enums";
import { cn } from "@/lib/utils";

type Session = { name: string; email: string; role: string };

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({
  role,
  isSuperAdmin = false,
  onNavigate,
}: {
  role: string;
  isSuperAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = NAV.map((g) => ({
    ...g,
    items: g.items.filter(
      (it) =>
        (!it.adminOnly || role === "ADMIN") &&
        (!it.managerOnly || role === "ADMIN" || role === "MANAGER"),
    ),
  })).filter((g) => g.items.length > 0);
  // Platform-owner-only section (controlled by SUPER_ADMIN_EMAILS, not roles).
  if (isSuperAdmin) {
    groups.push({
      section: "Platform",
      items: [{ href: "/admin", label: "All businesses", icon: Shield }],
    });
  }
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {groups.map((group) => (
        <div key={group.section}>
          <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
            {group.section}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent-soft text-accent"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
                    )}
                    <Icon className="size-[18px] shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* ── Mobile bottom nav ─────────────────────────────────────────────── */
const BOTTOM_NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/pos", label: "POS", icon: ScanLine },
] as const;

function BottomNav({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 flex h-14 items-stretch border-t border-border bg-background lg:hidden print:hidden">
      {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              active ? "text-accent" : "text-muted-foreground",
            )}
          >
            <Icon className="size-[18px]" />
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onMenuClick}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
      >
        <Menu className="size-[18px]" />
        More
      </button>
    </nav>
  );
}

/* ── Brand ─────────────────────────────────────────────────────────── */
function Brand() {
  return (
    <Link href="/" className="flex items-center justify-center px-5 py-5">
      {/* Light mode: black logo. Dark mode: white logo. */}
      <Image
        src="/perico-light.png"
        alt="PERICO"
        width={800}
        height={1027}
        className="h-16 w-auto dark:hidden"
        priority
      />
      <Image
        src="/perico-dark.png"
        alt="PERICO"
        width={800}
        height={1058}
        className="hidden h-16 w-auto dark:block"
        priority
      />
    </Link>
  );
}

/* ── Inline theme toggle for use inside the drawer ─────────────────── */
function DrawerThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    const val = next ? "dark" : "light";
    document.cookie = `rong-theme=${val};path=/;max-age=31536000;samesite=lax`;
    try { localStorage.setItem("rong-theme", val); } catch {}
    setDark(next);
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}

/* ── Desktop user dropdown ─────────────────────────────────────────── */
function UserMenu({ session }: { session: Session }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md p-1 pr-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <span className="grid size-9 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            {initials(session.name)}
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-medium">{session.name}</span>
            <span className="text-xs text-muted-foreground">
              {ROLE_LABEL[session.role as Role] ?? session.role}
            </span>
          </span>
          <ChevronsUpDown className="hidden size-4 text-muted-foreground sm:block" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-56 origin-top-right rounded-lg border border-border bg-card p-1.5 shadow-lg data-[state=open]:animate-scale-in"
        >
          <div className="px-2.5 py-2">
            <p className="text-sm font-medium">{session.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {session.email}
            </p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild>
            <Link
              href="/account"
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none transition-colors hover:bg-muted data-[highlighted]:bg-muted cursor-pointer"
            >
              <UserCircle className="size-4" />
              Account settings
            </Link>
          </DropdownMenu.Item>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted cursor-pointer"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ── App shell ─────────────────────────────────────────────────────── */
export function AppShell({
  session,
  isSuperAdmin = false,
  children,
}: {
  session: Session;
  isSuperAdmin?: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="grain min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex print:hidden">
        <Brand />
        <NavLinks role={session.role} isSuperAdmin={isSuperAdmin} />
        <div className="hairline p-3 text-[0.65rem] text-muted-foreground">
          PERICO ERP · v0.1
        </div>
      </aside>

      {/* Mobile drawer — always in DOM, shown/hidden via CSS (no timing races) */}
      <div className="lg:hidden print:hidden">
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
            mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
          )}
          onClick={() => setMobileOpen(false)}
        />
        {/* Drawer */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface shadow-xl transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between pr-3">
            <Brand />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>
          <NavLinks role={session.role} isSuperAdmin={isSuperAdmin} onNavigate={() => setMobileOpen(false)} />
          {/* Footer: account + theme toggle + logout */}
          <div className="hairline space-y-0.5 p-3">
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <UserCircle className="size-4" />
              Account settings
            </Link>
            <DrawerThemeToggle />
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* Main column */}
      <div className="lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background px-4 sm:bg-background/80 sm:backdrop-blur-md sm:px-6 print:hidden">
          {/* Hamburger hidden on mobile — use the bottom nav "More" button instead */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="hidden size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted sm:grid lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          {/* Desktop search — submits to /search */}
          <form action="/search" className="relative hidden flex-1 items-center sm:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <input
              type="search"
              name="q"
              placeholder="Search products, SKUs, orders, customers…"
              className="h-9 w-full max-w-md rounded-md border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            {/* Mobile search icon → /search page */}
            <Link
              href="/search"
              aria-label="Search"
              className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted sm:hidden"
            >
              <Search className="size-4" />
            </Link>
            <ThemeToggle />
            <div className="h-6 w-px bg-border" />
            <UserMenu session={session} />
          </div>
        </header>

        <main className="px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6 print:p-0">{children}</main>
      </div>

      <BottomNav onMenuClick={() => setMobileOpen(true)} />
    </div>
  );
}
