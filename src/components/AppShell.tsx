import { NavLink, Outlet, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/deals", label: "Deals" },
  { to: "/tasks", label: "Tasks" },
];

export default function AppShell() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const background = pathname.startsWith("/customers")
    ? "customers"
    : pathname.startsWith("/deals")
      ? "deals"
      : pathname.startsWith("/tasks")
        ? "tasks"
        : pathname.startsWith("/dashboard")
          ? "dashboard"
          : "general";

  return (
    <div className="font-inter min-h-screen bg-sky-50 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col md:flex-row">
        <aside className="crm-sidebar w-full shrink-0 border-b border-sky-200 p-4 text-slate-800 md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r md:p-5 lg:w-64">
          <div className="mb-4 md:mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">NexaCRM</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900 md:mt-2 md:text-2xl">Operations</h1>
          </div>

          <nav aria-label="Main navigation" className="crm-navigation flex gap-2 overflow-x-auto pb-1 md:flex-col md:space-y-2 md:overflow-visible md:pb-0">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-11 shrink-0 items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 md:min-h-10 md:px-3 ${
                    isActive
                      ? "bg-sky-700 text-white shadow-sm"
                      : "text-slate-700 hover:bg-white/80 hover:text-slate-950"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-10 hidden rounded-lg border border-sky-200 bg-white/70 p-3 text-sm text-slate-700 md:block">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Signed in</p>
            <p className="mt-2 truncate font-medium">{user?.email ?? "Unknown user"}</p>
          </div>
        </aside>

        <main className={`page-background page-background--${background} min-w-0 flex-1 p-4 sm:p-6 lg:p-8`}>
          <header className="mb-5 flex flex-col gap-3 rounded-xl border border-sky-100 bg-white/95 p-4 shadow-sm sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
            <div>
              <p className="text-sm font-medium text-slate-600">Welcome back</p>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">CRM overview</h2>
            </div>

            <button
              type="button"
              onClick={() => signOut(auth)}
              className="min-h-11 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 sm:min-h-10"
            >
              Log out
            </button>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
