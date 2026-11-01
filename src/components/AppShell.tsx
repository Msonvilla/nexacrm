import { NavLink, Outlet } from "react-router-dom";
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="w-full max-w-72 border-r border-slate-200 bg-slate-900 p-6 text-slate-100">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">NexaCRM</p>
            <h1 className="mt-2 text-2xl font-bold">Operations</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-500 text-white shadow-sm"
                      : "text-slate-200 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-10 rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in</p>
            <p className="mt-2 truncate font-medium">{user?.email ?? "Unknown user"}</p>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          <header className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Welcome back</p>
              <h2 className="text-2xl font-bold text-slate-900">CRM overview</h2>
            </div>

            <button
              type="button"
              onClick={() => signOut(auth)}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
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
