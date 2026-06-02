import {
  LayoutDashboard,
  Shirt,
  Boxes,
  Truck,
  Factory,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
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
      { href: "/sales", label: "Sales orders", icon: Receipt },
      { href: "/customers", label: "Customers", icon: Users },
    ],
  },
];
