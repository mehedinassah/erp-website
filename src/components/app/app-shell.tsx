"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Menu, X, LogOut, ChevronsUpDown, Search,
  LayoutDashboard, Package, ScanLine, BookOpen,
} from "lucide-react";
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
  onNavigate,
}: {
  role: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = NAV.map((g) => ({
    ...g,
    items: g.items.filter((it) => !it.adminOnly || role === "ADMIN"),
  })).filter((g) => g.items.length > 0);
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
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
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

const BOTTOM_NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/pos", label: "POS", icon: ScanLine },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
] as const;

function BottomNav({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 flex h-14 items-stretch border-t border-border bg-background/90 backdrop-blur-md lg:hidden print:hidden">
      {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              active ? "text-accent" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-[18px]" />
            {label}
          </Link>
        );
      })}
      <button
        onClick={onMenuClick}
        className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Menu className="size-[18px]" />
        More
      </button>
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
      <span className="grid size-9 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground">
        R
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight">
          RONG
        </span>
        <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          Inventory
        </span>
      </span>
    </Link>
  );
}

function UserMenu({ session }: { session: Session }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 rounded-md p-1 pr-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
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

export function AppShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="grain min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex print:hidden">
        <Brand />
        <NavLinks role={session.role} />
        <div className="hairline p-3 text-[0.65rem] text-muted-foreground">
          RONG ERP · v0.1 · Dhaka
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface shadow-xl animate-rise">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavLinks role={session.role} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6 print:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted lg:hidden cursor-pointer"
          >
            <Menu className="size-5" />
          </button>

          <div className="relative hidden flex-1 items-center sm:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search products, SKUs, orders…"
              className="h-9 w-full max-w-md rounded-md border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
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
