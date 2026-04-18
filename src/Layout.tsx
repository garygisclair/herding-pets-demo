import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  PawPrint,
  ClipboardCheck,
  LayoutList,
  PanelRightOpen,
  PanelRightClose,
  ChevronsUpDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", end: true, icon: PawPrint, label: "My Pets" },
  { to: "/activity", icon: ClipboardCheck, label: "Activity Log" },
  { to: "/reports", icon: LayoutList, label: "Reports" },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const ToggleIcon = collapsed ? PanelRightClose : PanelRightOpen;

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          "flex flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-[width] duration-200",
          collapsed ? "w-[70px]" : "w-[280px]",
        )}
      >
        <div className="py-4">
          <div
            className={cn(
              "relative flex items-center px-4 py-3",
              collapsed && "justify-center",
            )}
          >
            <h1
              className={cn(
                "font-display text-2xl font-normal whitespace-nowrap text-white",
                collapsed
                  ? "pointer-events-none absolute opacity-0"
                  : "opacity-100 transition-opacity duration-150 delay-200",
              )}
            >
              Herding Pets
            </h1>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={cn(
                "opacity-50 transition-opacity hover:opacity-100",
                !collapsed && "ml-auto",
              )}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ToggleIcon className="size-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-3 pt-4">
            {navItems.map(({ to, end, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3.5 rounded-lg px-3.5 py-3 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )
                }
              >
                <Icon className="size-5 shrink-0" />
                <span
                  className={cn(
                    "whitespace-nowrap",
                    collapsed ? "opacity-0" : "opacity-100 transition-opacity duration-150 delay-200",
                  )}
                >
                  {label}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto px-4 pb-6 pt-4">
          <div
            className={cn(
              "relative flex items-center rounded-lg",
              collapsed ? "justify-center" : "gap-3.5 bg-background px-3.5 py-2",
            )}
          >
            <Avatar className="size-9 shrink-0">
              <AvatarImage
                src={`${import.meta.env.BASE_URL}avatars/francine.png`}
                alt="Francine Poulet"
              />
              <AvatarFallback className="bg-gradient-to-br from-[#f4a261] to-[#e76f51] text-sm font-semibold text-white">
                FP
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "min-w-0 flex-1 whitespace-nowrap leading-tight",
                collapsed
                  ? "pointer-events-none absolute opacity-0"
                  : "opacity-100 transition-opacity duration-150 delay-200",
              )}
            >
              <div className="truncate text-sm text-sidebar-foreground">Francine Poulet</div>
              <div className="text-[10px] text-pets">Free account</div>
            </div>
            <button
              className={cn(
                "hover:opacity-100",
                collapsed
                  ? "pointer-events-none absolute opacity-0"
                  : "opacity-50 transition-opacity duration-150 delay-200",
              )}
            >
              <ChevronsUpDown className="size-5" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1024px] px-16 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
