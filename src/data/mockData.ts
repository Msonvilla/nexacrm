import type { ActivityItem, Customer, Deal, TaskRecord } from "../types";

export const customers: Customer[] = [
  {
    id: "cus-101",
    firstName: "Ava",
    lastName: "Patel",
    email: "ava@brightpath.io",
    phone: "+1 (415) 245-1187",
    company: "BrightPath Studio",
    status: "active",
    value: 24000,
    notes: "Interested in a premium support package.",
    createdAt: "2025-01-12T09:00:00.000Z",
    updatedAt: "2025-02-28T14:15:00.000Z",
    ownerId: "user-1",
  },
  {
    id: "cus-102",
    firstName: "Lucas",
    lastName: "Nguyen",
    email: "lucas@northpeak.co",
    phone: "+1 (512) 421-9988",
    company: "NorthPeak Co.",
    status: "new",
    value: 12000,
    notes: "Onboarding call scheduled for next Friday.",
    createdAt: "2025-02-03T12:45:00.000Z",
    updatedAt: "2025-02-25T10:30:00.000Z",
    ownerId: "user-1",
  },
  {
    id: "cus-103",
    firstName: "Sophia",
    lastName: "Martinez",
    email: "sophia@harborlabs.com",
    phone: "+1 (773) 332-4451",
    company: "Harbor Labs",
    status: "inactive",
    value: 8500,
    notes: "Paused after vendor evaluation. Re-engage after Q3 planning.",
    createdAt: "2024-12-18T16:20:00.000Z",
    updatedAt: "2025-02-20T08:10:00.000Z",
    ownerId: "user-2",
  },
  {
    id: "cus-104",
    firstName: "Daniel",
    lastName: "Brown",
    email: "daniel@riverlane.ai",
    phone: "+1 (646) 118-5571",
    company: "Riverlane AI",
    status: "at-risk",
    value: 31000,
    notes: "Contract renewal discussion due this week.",
    createdAt: "2025-01-28T13:10:00.000Z",
    updatedAt: "2025-03-01T09:40:00.000Z",
    ownerId: "user-3",
  },
];

export const deals: Deal[] = [
  {
    id: "deal-1",
    customerId: "cus-101",
    title: "BrightPath Studio Retainer",
    stage: "proposal",
    amount: 18000,
    closeDate: "2025-03-18",
    notes: "Awaiting approval for the enterprise add-on.",
    createdAt: "2025-02-02T10:00:00.000Z",
    updatedAt: "2025-02-28T14:15:00.000Z",
    ownerId: "user-1",
  },
  {
    id: "deal-2",
    customerId: "cus-102",
    title: "NorthPeak CRM Setup",
    stage: "qualified",
    amount: 9800,
    closeDate: "2025-03-29",
    notes: "Needs implementation timeline before kickoff.",
    createdAt: "2025-02-18T11:00:00.000Z",
    updatedAt: "2025-02-25T10:30:00.000Z",
    ownerId: "user-1",
  },
  {
    id: "deal-3",
    customerId: "cus-104",
    title: "Riverlane AI Renewal",
    stage: "negotiation",
    amount: 27000,
    closeDate: "2025-03-12",
    notes: "Converting from annual contract to usage-based plan.",
    createdAt: "2025-02-11T08:25:00.000Z",
    updatedAt: "2025-03-01T09:40:00.000Z",
    ownerId: "user-3",
  },
];

export const tasks: TaskRecord[] = [
  {
    id: "task-1",
    title: "Follow up with BrightPath on proposal review",
    dueDate: "2025-03-07",
    assigneeId: "user-1",
    relatedCustomerId: "cus-101",
    status: "in-progress",
    createdAt: "2025-02-26T12:00:00.000Z",
    updatedAt: "2025-02-28T14:15:00.000Z",
    ownerId: "user-1",
  },
  {
    id: "task-2",
    title: "Prepare onboarding checklist for NorthPeak",
    dueDate: "2025-03-05",
    assigneeId: "user-2",
    relatedCustomerId: "cus-102",
    status: "todo",
    createdAt: "2025-02-24T09:00:00.000Z",
    updatedAt: "2025-02-25T10:30:00.000Z",
    ownerId: "user-1",
  },
  {
    id: "task-3",
    title: "Review contract risks for Riverlane",
    dueDate: "2025-03-11",
    assigneeId: "user-3",
    relatedCustomerId: "cus-104",
    status: "todo",
    createdAt: "2025-02-27T07:00:00.000Z",
    updatedAt: "2025-03-01T09:40:00.000Z",
    ownerId: "user-3",
  },
];

export const activity: ActivityItem[] = [
  {
    id: "act-1",
    type: "customer-created",
    message: "Ava Patel was added to the customer list.",
    customerId: "cus-101",
    createdAt: "2025-02-28T14:15:00.000Z",
    updatedAt: "2025-02-28T14:15:00.000Z",
    ownerId: "user-1",
  },
  {
    id: "act-2",
    type: "deal-updated",
    message: "NorthPeak CRM Setup moved to qualified.",
    customerId: "cus-102",
    createdAt: "2025-02-25T10:30:00.000Z",
    updatedAt: "2025-02-25T10:30:00.000Z",
    ownerId: "user-1",
  },
  {
    id: "act-3",
    type: "task-completed",
    message: "Contract review for Harbor Labs was completed.",
    customerId: "cus-103",
    createdAt: "2025-02-22T11:10:00.000Z",
    updatedAt: "2025-02-22T11:10:00.000Z",
    ownerId: "user-2",
  },
];

export const dashboardStats = {
  totalCustomers: customers.length,
  activeDeals: deals.filter((deal) => ["lead", "qualified", "proposal", "negotiation"].includes(deal.stage)).length,
  openTasks: tasks.filter((task) => task.status !== "done").length,
  monthlyRevenue: customers.reduce((sum, customer) => sum + (customer.value ?? 0), 0),
};

export function getCustomerById(id: string) {
  return customers.find((customer) => customer.id === id) ?? null;
}

export function upsertCustomer(customer: Customer) {
  const index = customers.findIndex((item) => item.id === customer.id);

  if (index === -1) {
    customers.unshift(customer);
    return customer;
  }

  customers[index] = customer;
  return customer;
}
