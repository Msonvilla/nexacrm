import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listCustomers } from "../services/customerService";
import { createTask, getTask, updateTask } from "../services/taskService";
import type { Customer, TaskRecord, TaskStatus } from "../types";

type TaskFormState = {
  title: string;
  relatedCustomerId: string;
  dueDate: string;
  status: TaskStatus;
};

const emptyForm: TaskFormState = {
  title: "",
  relatedCustomerId: "",
  dueDate: "",
  status: "todo",
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

export default function TaskFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [existingTask, setExistingTask] = useState<TaskRecord | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadForm() {
      if (!user) {
        setError("You must be signed in to manage tasks.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const [customerResults, taskResult] = await Promise.all([
          listCustomers(user.uid),
          id ? getTask(user.uid, id) : Promise.resolve(null),
        ]);
        if (!active) return;

        setCustomers(customerResults);
        if (id && !taskResult) {
          setError("Task not found or you do not have permission to edit it.");
          return;
        }
        if (taskResult) {
          setExistingTask(taskResult);
          setForm({
            title: taskResult.title,
            relatedCustomerId: taskResult.relatedCustomerId ?? "",
            dueDate: taskResult.dueDate ?? "",
            status: taskResult.status,
          });
        } else {
          setExistingTask(null);
          setForm(emptyForm);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? `Could not load task form: ${loadError.message}`
              : "Could not load task form. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadForm();
    return () => {
      active = false;
    };
  }, [id, user]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setError("You must be signed in to save a task.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const task = {
        title: form.title.trim(),
        relatedCustomerId: form.relatedCustomerId || undefined,
        dueDate: form.dueDate || undefined,
        status: form.status,
        assigneeId: user.uid,
      };
      if (id) {
        await updateTask(user.uid, id, task);
      } else {
        await createTask(user.uid, task);
      }
      navigate("/tasks");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `Could not save task: ${saveError.message}`
          : "Could not save task. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {existingTask ? "Edit task" : "Add task"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">Set a clear follow-up and optionally link it to a customer.</p>
        </div>
        <Link to="/tasks" className="text-sm font-medium text-gray-600 hover:text-gray-600">
          Back to tasks
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-600">Loading task...</p>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-gray-700">Task title</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  maxLength={160}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Related customer</span>
                <select
                  name="relatedCustomerId"
                  value={form.relatedCustomerId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-400"
                >
                  <option value="">No customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName}{customer.company ? ` — ${customer.company}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Due date</span>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Status</span>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-400"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Link
                to="/tasks"
                className="crm-button min-h-11 px-4 py-2.5 text-sm sm:min-h-10"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || Boolean(id && !existingTask)}
                className="min-h-11 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10"
              >
                {saving ? "Saving..." : existingTask ? "Save changes" : "Create task"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
