import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
  where,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { TaskRecord, TaskStatus } from "../types";
import { addActivityToBatch } from "./activityService";

export type TaskInput = Omit<TaskRecord, "id" | "createdAt" | "updatedAt" | "ownerId">;

function toTask(snapshot: DocumentSnapshot<DocumentData>): TaskRecord {
  const data = snapshot.data();
  if (!data) {
    throw new Error(`Task ${snapshot.id} has no data.`);
  }

  const createdAt = data.createdAt;
  const updatedAt = data.updatedAt;
  if (!(createdAt instanceof Timestamp) || !(updatedAt instanceof Timestamp)) {
    throw new Error(`Task ${snapshot.id} has invalid timestamps.`);
  }

  return {
    id: snapshot.id,
    title: data.title,
    dueDate: data.dueDate,
    assigneeId: data.assigneeId,
    relatedCustomerId: data.relatedCustomerId,
    status: data.status as TaskStatus,
    ownerId: data.ownerId,
    createdAt: createdAt.toDate().toISOString(),
    updatedAt: updatedAt.toDate().toISOString(),
  };
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as T;
}

export async function listTasks(ownerId: string): Promise<TaskRecord[]> {
  const tasksQuery = query(collection(db, "tasks"), where("ownerId", "==", ownerId));
  const snapshots = await getDocs(tasksQuery);
  return snapshots.docs
    .map(toTask)
    .sort((first, second) => {
      if (!first.dueDate) return 1;
      if (!second.dueDate) return -1;
      return first.dueDate.localeCompare(second.dueDate);
    });
}

export async function getTask(ownerId: string, taskId: string): Promise<TaskRecord | null> {
  const snapshot = await getDoc(doc(db, "tasks", taskId));
  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    return null;
  }
  return toTask(snapshot);
}

export async function createTask(ownerId: string, task: TaskInput): Promise<void> {
  const taskRef = doc(collection(db, "tasks"));
  const batch = writeBatch(db);
  batch.set(
    taskRef,
    withoutUndefined({
      ...task,
      ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  addActivityToBatch(batch, ownerId, {
    type: "task-created",
    message: `Created task "${task.title}".`,
    entityType: "task",
    entityId: taskRef.id,
    customerId: task.relatedCustomerId,
  });
  await batch.commit();
}

export async function updateTask(
  ownerId: string,
  taskId: string,
  task: TaskInput,
): Promise<void> {
  const taskRef = doc(db, "tasks", taskId);
  const snapshot = await getDoc(taskRef);
  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Task not found or you do not have permission to edit it.");
  }

  const batch = writeBatch(db);
  batch.update(
    taskRef,
    withoutUndefined({
      ...task,
      updatedAt: serverTimestamp(),
    }),
  );
  const completed = task.status === "done" && snapshot.data().status !== "done";
  addActivityToBatch(batch, ownerId, {
    type: completed ? "task-completed" : "task-updated",
    message: completed
      ? `Completed task "${task.title}".`
      : `Updated task "${task.title}".`,
    entityType: "task",
    entityId: taskId,
    customerId: task.relatedCustomerId,
  });
  await batch.commit();
}

export async function deleteTask(ownerId: string, taskId: string): Promise<void> {
  const taskRef = doc(db, "tasks", taskId);
  const snapshot = await getDoc(taskRef);
  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Task not found or you do not have permission to delete it.");
  }

  const data = snapshot.data();
  const batch = writeBatch(db);
  batch.delete(taskRef);
  addActivityToBatch(batch, ownerId, {
    type: "task-deleted",
    message: `Deleted task "${data.title}".`,
    entityType: "task",
    entityId: taskId,
    customerId: data.relatedCustomerId,
  });
  await batch.commit();
}
