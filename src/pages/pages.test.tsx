import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CustomerFormPage from "./CustomerFormPage";
import CustomersPage from "./CustomersPage";
import DashboardPage from "./DashboardPage";
import { getDealStageTrend } from "./dealStageTrend";
import DealFormPage from "./DealFormPage";
import DealsPage from "./DealsPage";
import TaskFormPage from "./TaskFormPage";
import TasksPage from "./TasksPage";
import type { Customer, Deal, TaskRecord } from "../types";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: { user: { uid: "owner-1" } },
}));

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("../services/customerService", () => ({
  createCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  getCustomer: vi.fn(),
  listCustomers: vi.fn(),
  updateCustomer: vi.fn(),
}));

vi.mock("../services/activityService", () => ({
  listRecentActivities: vi.fn(),
}));

vi.mock("../services/dealService", () => ({
  createDeal: vi.fn(),
  deleteDeal: vi.fn(),
  getDeal: vi.fn(),
  listDeals: vi.fn(),
  updateDeal: vi.fn(),
}));

vi.mock("../services/taskService", () => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  getTask: vi.fn(),
  listTasks: vi.fn(),
  updateTask: vi.fn(),
}));

import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "../services/customerService";
import { listRecentActivities } from "../services/activityService";
import { createDeal, deleteDeal, getDeal, listDeals, updateDeal } from "../services/dealService";
import { createTask, deleteTask, getTask, listTasks, updateTask } from "../services/taskService";

const customer: Customer = {
  id: "customer-1",
  firstName: "Mson",
  lastName: "Villa",
  email: "mson@example.com",
  company: "Nexa",
  status: "new",
  value: 0,
  ownerId: "owner-1",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-02T10:00:00.000Z",
};

const deal: Deal = {
  id: "deal-1",
  customerId: customer.id,
  title: "CRM onboarding",
  stage: "qualified",
  amount: 200,
  ownerId: "owner-1",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-02T10:00:00.000Z",
};

const task: TaskRecord = {
  id: "task-1",
  title: "Call customer",
  relatedCustomerId: customer.id,
  dueDate: "2026-01-10",
  assigneeId: "owner-1",
  status: "todo",
  ownerId: "owner-1",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-02T10:00:00.000Z",
};

function renderPage(page: ReactNode) {
  return render(<MemoryRouter>{page}</MemoryRouter>);
}

function renderForm(initialPath: string, path: string, page: ReactNode, successPath: string, successText: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={path} element={page} />
        <Route path={successPath} element={<p>{successText}</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(listRecentActivities).mockResolvedValue([]);
  vi.mocked(listCustomers).mockResolvedValue([customer]);
  vi.mocked(listDeals).mockResolvedValue([deal]);
  vi.mocked(listTasks).mockResolvedValue([task]);
  vi.mocked(deleteCustomer).mockResolvedValue();
  vi.mocked(deleteDeal).mockResolvedValue();
  vi.mocked(deleteTask).mockResolvedValue();
  vi.mocked(updateTask).mockResolvedValue();
  vi.mocked(createCustomer).mockResolvedValue();
  vi.mocked(getCustomer).mockResolvedValue(customer);
  vi.mocked(updateCustomer).mockResolvedValue();
  vi.mocked(createDeal).mockResolvedValue();
  vi.mocked(getDeal).mockResolvedValue(deal);
  vi.mocked(updateDeal).mockResolvedValue();
  vi.mocked(createTask).mockResolvedValue();
  vi.mocked(getTask).mockResolvedValue(task);
  vi.stubGlobal("confirm", vi.fn(() => true));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CRM list pages", () => {
  it("renders the deal chart on the dashboard", async () => {
    renderPage(<DashboardPage />);

    const chart = await screen.findByRole("img", { name: "Deal value by stage chart" });
    expect(chart).toBeInTheDocument();
    expect(screen.getByText("Deal value by stage")).toBeInTheDocument();
    expect(screen.getByText("Higher than previous stage")).toBeInTheDocument();
  });

  it("colors deal stages according to whether their value rises or falls", () => {
    expect(getDealStageTrend(300, 200)).toBe("increase");
    expect(getDealStageTrend(100, 200)).toBe("decrease");
    expect(getDealStageTrend(200, 200)).toBe("steady");
  });

  it("keeps the deal chart visible when there are no deals", async () => {
    vi.mocked(listDeals).mockResolvedValue([]);
    renderPage(<DashboardPage />);

    expect(await screen.findByRole("img", { name: "Deal value by stage chart" })).toBeInTheDocument();
    expect(screen.getByText("No deals yet. Add a deal to see values in the chart.")).toBeInTheDocument();
  });

  it("loads and filters customers by name", async () => {
    const user = userEvent.setup();
    renderPage(<CustomersPage />);

    expect(await screen.findByText("Mson Villa")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Search customers"), "missing");

    expect(screen.getByText("No customers match your search.")).toBeInTheDocument();
    expect(screen.queryByText("Mson Villa")).not.toBeInTheDocument();
  });

  describe("CRM create forms", () => {
    it("creates a customer and navigates back to the customer list", async () => {
      const user = userEvent.setup();
      renderForm("/customers/new", "/customers/new", <CustomerFormPage />, "/customers", "Customer list");

      await user.type(screen.getByLabelText("First name"), "  Jane  ");
      await user.type(screen.getByLabelText("Last name"), "Doe");
      await user.type(screen.getByLabelText("Email"), "jane@example.com");
      await user.type(screen.getByLabelText("Company"), "Acme");
      await user.click(screen.getByRole("button", { name: "Create customer" }));

      await waitFor(() => expect(createCustomer).toHaveBeenCalledWith("owner-1", expect.objectContaining({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        company: "Acme",
        status: "new",
      })));
      expect(await screen.findByText("Customer list")).toBeInTheDocument();
    });

    it("creates a deal linked to the selected customer", async () => {
      const user = userEvent.setup();
      renderForm("/deals/new", "/deals/new", <DealFormPage />, "/deals", "Deal list");

      await user.type(await screen.findByLabelText("Deal name"), "Annual renewal");
      await user.selectOptions(screen.getByLabelText("Customer"), customer.id);
      await user.selectOptions(screen.getByLabelText("Stage"), "qualified");
      await user.type(screen.getByLabelText("Amount"), "1200");
      await user.click(screen.getByRole("button", { name: "Create deal" }));

      await waitFor(() => expect(createDeal).toHaveBeenCalledWith("owner-1", expect.objectContaining({
        title: "Annual renewal",
        customerId: customer.id,
        stage: "qualified",
        amount: 1200,
      })));
      expect(await screen.findByText("Deal list")).toBeInTheDocument();
    });

    it("creates a task with a customer link and due date", async () => {
      const user = userEvent.setup();
      renderForm("/tasks/new", "/tasks/new", <TaskFormPage />, "/tasks", "Task list");

      await user.type(await screen.findByLabelText("Task title"), "Schedule follow-up");
      await user.selectOptions(screen.getByLabelText("Related customer"), customer.id);
      await user.type(screen.getByLabelText("Due date"), "2026-02-01");
      await user.click(screen.getByRole("button", { name: "Create task" }));

      await waitFor(() => expect(createTask).toHaveBeenCalledWith("owner-1", expect.objectContaining({
        title: "Schedule follow-up",
        relatedCustomerId: customer.id,
        dueDate: "2026-02-01",
        status: "todo",
        assigneeId: "owner-1",
      })));
      expect(await screen.findByText("Task list")).toBeInTheDocument();
    });
  });

  it("asks for confirmation and removes a customer", async () => {
    const user = userEvent.setup();
    renderPage(<CustomersPage />);

    const row = await screen.findByText("Mson Villa");
    await user.click(within(row.closest("tr") as HTMLElement).getByRole("button", { name: "Delete" }));

    expect(window.confirm).toHaveBeenCalledWith("Delete Mson Villa? This cannot be undone.");
    await waitFor(() => expect(deleteCustomer).toHaveBeenCalledWith("owner-1", customer.id));
    await waitFor(() => expect(screen.queryByText("Mson Villa")).not.toBeInTheDocument());
  });

  it("shows deals in their pipeline stage and deletes after confirmation", async () => {
    const user = userEvent.setup();
    renderPage(<DealsPage />);

    expect(await screen.findByText("CRM onboarding")).toBeInTheDocument();
    const dealCard = screen.getByText("CRM onboarding").closest("article") as HTMLElement;
    await user.click(within(dealCard).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteDeal).toHaveBeenCalledWith("owner-1", deal.id));
    await waitFor(() => expect(screen.queryByText("CRM onboarding")).not.toBeInTheDocument());
  });

  it("updates a task status and deletes the task after confirmation", async () => {
    const user = userEvent.setup();
    renderPage(<TasksPage />);

    expect(await screen.findByText("Call customer")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Update status for Call customer" }), "done");
    await waitFor(() => expect(updateTask).toHaveBeenCalledWith(
      "owner-1",
      task.id,
      expect.objectContaining({ status: "done", title: task.title }),
    ));

    const taskRow = screen.getByText("Call customer").closest("li") as HTMLElement;
    await user.click(within(taskRow).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith("owner-1", task.id));
    await waitFor(() => expect(screen.queryByText("Call customer")).not.toBeInTheDocument());
  });

  it("does not delete a customer when confirmation is declined", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    renderPage(<CustomersPage />);

    const row = await screen.findByText("Mson Villa");
    fireEvent.click(within(row.closest("tr") as HTMLElement).getByRole("button", { name: "Delete" }));

    expect(deleteCustomer).not.toHaveBeenCalled();
    expect(screen.getByText("Mson Villa")).toBeInTheDocument();
  });
});
