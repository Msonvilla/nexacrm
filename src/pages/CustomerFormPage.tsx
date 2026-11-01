import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createCustomer, getCustomer, updateCustomer } from "../services/customerService";
import type { Customer, CustomerStatus } from "../types";

type CustomerFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  notes: string;
};

const defaultForm: CustomerFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  status: "new",
  notes: "",
};

export default function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormState>(defaultForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCustomer() {
    setError("");
    setExistingCustomer(null);

    if (!id) {
      setForm(defaultForm);
      setLoading(false);
      return;
    }

    if (!user) {
      setError("You must be signed in to edit a customer.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const customer = await getCustomer(user.uid, id);
      if (!active) {
        return;
      }
      if (!customer) {
        setError("Customer not found or you do not have permission to edit it.");
        return;
      }

      setExistingCustomer(customer);
      setForm({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone ?? "",
        company: customer.company ?? "",
        status: customer.status,
        notes: customer.notes ?? "",
      });
    } catch (loadError) {
      if (active) {
        setError(
          loadError instanceof Error
            ? `Could not load customer: ${loadError.message}`
            : "Could not load customer. Please try again.",
        );
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
    }

    void loadCustomer();
    return () => {
    active = false;
    };
  }, [id, user]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setError("You must be signed in to save a customer.");
      return;
    }

    const customer = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
      value: existingCustomer?.value ?? 0,
    };

    setSaving(true);
    setError("");
    try {
      if (id) {
        await updateCustomer(user.uid, id, customer);
      } else {
        await createCustomer(user.uid, customer);
      }
      navigate("/customers");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `Could not save customer: ${saveError.message}`
          : "Could not save customer. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {existingCustomer ? "Edit customer" : "Add customer"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Capture the key details needed to manage the customer relationship.
          </p>
        </div>

        <Link to="/customers" className="text-sm font-medium text-slate-600 hover:text-slate-500">
          Back to list
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading customer...</p>
        ) : (
          <>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">First name</span>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Last name</span>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Phone</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Company</span>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
            >
              <option value="new">New</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="at-risk">At risk</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            to="/customers"
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || Boolean(id && !existingCustomer)}
            className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            {saving ? "Saving..." : existingCustomer ? "Save changes" : "Create customer"}
          </button>
        </div>
          </>
        )}
      </form>
    </div>
  );
}
