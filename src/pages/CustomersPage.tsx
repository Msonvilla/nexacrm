import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { deleteCustomer, listCustomers } from "../services/customerService";
import type { Customer } from "../types";

const statusStyles: Record<Customer["status"], string> = {
  new: "bg-slate-100 text-gray-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-200 text-gray-700",
  "at-risk": "bg-amber-100 text-amber-700",
};

export default function CustomersPage() {
  const { user } = useAuth();
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      if (!user) {
        setError("You must be signed in to view customers.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const results = await listCustomers(user.uid);
        if (active) {
          setCustomerList(results);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? `Could not load customers: ${loadError.message}`
              : "Could not load customers. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCustomers();
    return () => {
      active = false;
    };
  }, [user]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return customerList;
    }

    return customerList.filter((customer) => {
      const values = [
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.company ?? "",
      ].join(" ");

      return values.toLowerCase().includes(term);
    });
  }, [customerList, search]);

  async function handleDelete(customer: Customer) {
    if (!user || !window.confirm(`Delete ${customer.firstName} ${customer.lastName}? This cannot be undone.`)) {
      return;
    }

    setDeletingId(customer.id);
    setError("");
    try {
      await deleteCustomer(user.uid, customer.id);
      setCustomerList((current) => current.filter((item) => item.id !== customer.id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete customer. Please try again.",
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customers</h1>
          <p className="mt-2 text-sm text-gray-600">Track prospects, active clients, and renewal opportunities.</p>
        </div>

        <Link
          to="/customers/new"
          className="crm-button min-h-11 px-4 py-2.5 text-sm sm:min-h-10"
        >
          New customer
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="search"
          placeholder="Search customers"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:bg-white"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">Company</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">Value</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-gray-600">
                    Loading customers...
                  </td>
                </tr>
              )}
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.company ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[customer.status]}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {customer.value ? `$${customer.value.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link to={`/customers/${customer.id}/edit`} className="crm-button min-h-9 px-3 py-1.5 text-sm">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(customer)}
                        disabled={deletingId === customer.id}
                        className="crm-delete text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                      >
                        {deletingId === customer.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && filteredCustomers.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-600">
            {search.trim() ? "No customers match your search." : "No customers yet. Create one to get started."}
          </div>
        )}
      </div>
    </div>
  );
}
