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
    <div className="font-inter min-h-screen bg-blue-50 text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="w-full max-w-72 border-r border-gray-200 bg-white p-6 text-gray-900">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">NexaCRM</p>
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
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Signed in</p>
            <p className="mt-2 truncate font-medium">{user?.email ?? "Unknown user"}</p>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          <header className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Welcome back</p>
              <h2 className="text-2xl font-bold text-gray-900">CRM overview</h2>
            </div>

            <button
              type="button"
              onClick={() => signOut(auth)}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
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
