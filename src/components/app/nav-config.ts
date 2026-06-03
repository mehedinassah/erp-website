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
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export type NavSection = {
  section: string;
  items: NavItem[];
};

export const NAV: NavSection[] = [
  {
    section: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Catalog",
    items: [{ href: "/products", label: "Products", icon: Shirt }],
  },
  {
    section: "Inventory",
    items: [{ href: "/stock", label: "Stock control", icon: Boxes }],
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
      { href: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
    ],
  },
];
