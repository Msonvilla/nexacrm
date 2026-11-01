import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  where,
  query,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Customer, CustomerStatus } from "../types";
import { addActivityToBatch } from "./activityService";

type CustomerInput = Omit<Customer, "id" | "createdAt" | "updatedAt" | "ownerId">;

function toCustomer(snapshot: DocumentSnapshot<DocumentData>): Customer {
  const data = snapshot.data();

  if (!data) {
    throw new Error(`Customer ${snapshot.id} has no data.`);
  }

  const createdAt = data.createdAt as Timestamp | undefined;
  const updatedAt = data.updatedAt as Timestamp | undefined;

  if (!(createdAt instanceof Timestamp) || !(updatedAt instanceof Timestamp)) {
    throw new Error(`Customer ${snapshot.id} has invalid timestamps.`);
  }

  return {
    id: snapshot.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    company: data.company,
    status: data.status as CustomerStatus,
    notes: data.notes,
    value: data.value,
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

export async function listCustomers(ownerId: string): Promise<Customer[]> {
  const customersQuery = query(
    collection(db, "customers"),
    where("ownerId", "==", ownerId),
  );
  const snapshots = await getDocs(customersQuery);

  return snapshots.docs
    .map(toCustomer)
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
}

export async function getCustomer(ownerId: string, customerId: string): Promise<Customer | null> {
  const snapshot = await getDoc(doc(db, "customers", customerId));
  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    return null;
  }

  return toCustomer(snapshot);
}

export async function createCustomer(ownerId: string, customer: CustomerInput): Promise<void> {
  const customerRef = doc(collection(db, "customers"));
  const batch = writeBatch(db);
  batch.set(customerRef, {
    ...withoutUndefined(customer),
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  addActivityToBatch(batch, ownerId, {
    type: "customer-created",
    message: `Added customer ${customer.firstName} ${customer.lastName}.`,
    entityType: "customer",
    entityId: customerRef.id,
  });
  await batch.commit();
}

export async function updateCustomer(
  ownerId: string,
  customerId: string,
  customer: CustomerInput,
): Promise<void> {
  const customerRef = doc(db, "customers", customerId);
  const snapshot = await getDoc(customerRef);

  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Customer not found or you do not have permission to edit it.");
  }

  const batch = writeBatch(db);
  batch.update(customerRef, {
    ...withoutUndefined(customer),
    updatedAt: serverTimestamp(),
  });
  addActivityToBatch(batch, ownerId, {
    type: "customer-updated",
    message: `Updated customer ${customer.firstName} ${customer.lastName}.`,
    entityType: "customer",
    entityId: customerId,
  });
  await batch.commit();
}

export async function deleteCustomer(ownerId: string, customerId: string): Promise<void> {
  const customerRef = doc(db, "customers", customerId);
  const customerSnapshot = await getDoc(customerRef);
  if (!customerSnapshot.exists() || customerSnapshot.data().ownerId !== ownerId) {
    throw new Error("Customer not found or you do not have permission to delete it.");
  }

  const [deals, tasks] = await Promise.all([
    getDocs(query(collection(db, "deals"), where("ownerId", "==", ownerId), where("customerId", "==", customerId))),
    getDocs(query(collection(db, "tasks"), where("ownerId", "==", ownerId), where("relatedCustomerId", "==", customerId))),
  ]);

  if (!deals.empty || !tasks.empty) {
    throw new Error("Remove this customer's linked deals and tasks before deleting the customer.");
  }

  const batch = writeBatch(db);
  batch.delete(customerRef);
  addActivityToBatch(batch, ownerId, {
    type: "customer-deleted",
    message: `Deleted customer ${customerSnapshot.data().firstName} ${customerSnapshot.data().lastName}.`,
    entityType: "customer",
    entityId: customerId,
  });
  await batch.commit();
}
