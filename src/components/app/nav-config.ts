import {
  LayoutDashboard,
  Shirt,
  Boxes,
  Truck,
  Factory,
  Receipt,
  Users,
  Settings,
  ScanLine,
  Tags,
  Tag,
  Warehouse,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  UserCog,
  FileText,
  ShieldCheck,
  Building2,
  CalendarClock,
  Wallet2,
  LineChart,
  Sparkles,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  managerOnly?: boolean; // visible to ADMIN + MANAGER only (hidden from STAFF)
  businessTypes?: string[]; // if set, only show for these tenant business types
};

export type NavSection = {
  section: string;
  items: NavItem[];
};

export const NAV: NavSection[] = [
  {
    section: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Catalog",
    items: [
      { href: "/products", label: "Products", icon: Shirt },
      { href: "/categories", label: "Categories", icon: Tag },
      { href: "/labels", label: "Barcode labels", icon: Tags },
    ],
  },
  {
    section: "Inventory",
    items: [
      { href: "/stock", label: "Stock control", icon: Boxes },
      { href: "/stock/take", label: "Stock take", icon: ClipboardCheck, managerOnly: true },
      { href: "/stock/transfer", label: "Transfer stock", icon: ArrowLeftRight, managerOnly: true },
      { href: "/stock/expiry", label: "Batches & expiry", icon: CalendarClock, businessTypes: ["GROCERY", "PHARMACY"] },
      { href: "/warehouses", label: "Warehouses", icon: Warehouse },
    ],
  },
  {
    section: "Purchasing",
    items: [
      { href: "/purchases", label: "Purchase orders", icon: Truck },
      { href: "/purchases/reorder", label: "Reorder suggestions", icon: Sparkles, managerOnly: true },
      { href: "/suppliers", label: "Suppliers", icon: Factory },
    ],
  },
  {
    section: "Sales",
    items: [
      { href: "/pos", label: "Point of sale", icon: ScanLine },
      { href: "/sales", label: "Sales orders", icon: Receipt },
      { href: "/quotes", label: "Quotations", icon: FileText, managerOnly: true },
      { href: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    section: "Dena–Paona",
    items: [
      { href: "/ledger", label: "Overview", icon: Wallet },
      { href: "/ledger/paona", label: "Paona (receivable)", icon: ArrowDownLeft },
      { href: "/ledger/dena", label: "Dena (payable)", icon: ArrowUpRight },
    ],
  },
  {
    section: "Finance",
    items: [
      { href: "/expenses", label: "Expenses", icon: Wallet2, managerOnly: true },
      { href: "/reports/pnl", label: "Profit & Loss", icon: LineChart, managerOnly: true },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/settings/business", label: "Business profile", icon: Building2, adminOnly: true },
      { href: "/settings/users", label: "Users & access", icon: UserCog, adminOnly: true },
      { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
      { href: "/admin/audit", label: "Audit log", icon: ShieldCheck, adminOnly: true },
    ],
  },
];
