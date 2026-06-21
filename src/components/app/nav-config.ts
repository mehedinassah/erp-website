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
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  managerOnly?: boolean; // visible to ADMIN + MANAGER only (hidden from STAFF)
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
      { href: "/stock/transfer", label: "Transfer stock", icon: ArrowLeftRight, managerOnly: true },
      { href: "/warehouses", label: "Warehouses", icon: Warehouse },
    ],
  },
  {
    section: "Purchasing",
    items: [
      { href: "/purchases", label: "Purchase orders", icon: Truck },
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
    section: "System",
    items: [
      { href: "/settings/business", label: "Business profile", icon: Building2, adminOnly: true },
      { href: "/settings/users", label: "Users & access", icon: UserCog, adminOnly: true },
      { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
      { href: "/admin/audit", label: "Audit log", icon: ShieldCheck, adminOnly: true },
    ],
  },
];
