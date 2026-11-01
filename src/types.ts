export type CustomerStatus = "new" | "active" | "inactive" | "at-risk";
export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type TaskStatus = "todo" | "in-progress" | "done";

export interface FirestoreEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
}

export interface Customer extends FirestoreEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  status: CustomerStatus;
  notes?: string;
  value?: number;
}

export interface Deal extends FirestoreEntity {
  customerId: string;
  title: string;
  stage: DealStage;
  amount: number;
  closeDate?: string;
  notes?: string;
}

export interface TaskRecord extends FirestoreEntity {
  title: string;
  dueDate?: string;
  assigneeId?: string;
  relatedCustomerId?: string;
  status: TaskStatus;
}

export interface ActivityItem extends FirestoreEntity {
  type:
    | "customer-created"
    | "customer-updated"
    | "customer-deleted"
    | "deal-created"
    | "deal-updated"
    | "deal-deleted"
    | "task-created"
    | "task-updated"
    | "task-completed"
    | "task-deleted"
    | "note-added";
  message: string;
  entityType?: "customer" | "deal" | "task";
  entityId?: string;
  customerId?: string;
}
