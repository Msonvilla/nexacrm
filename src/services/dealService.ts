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
import type { Deal, DealStage } from "../types";
import { addActivityToBatch } from "./activityService";

export type DealInput = Omit<Deal, "id" | "createdAt" | "updatedAt" | "ownerId">;

function toDeal(snapshot: DocumentSnapshot<DocumentData>): Deal {
  const data = snapshot.data();
  if (!data) {
    throw new Error(`Deal ${snapshot.id} has no data.`);
  }

  const createdAt = data.createdAt;
  const updatedAt = data.updatedAt;
  if (!(createdAt instanceof Timestamp) || !(updatedAt instanceof Timestamp)) {
    throw new Error(`Deal ${snapshot.id} has invalid timestamps.`);
  }

  return {
    id: snapshot.id,
    customerId: data.customerId,
    title: data.title,
    stage: data.stage as DealStage,
    amount: data.amount,
    closeDate: data.closeDate,
    notes: data.notes,
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

export async function listDeals(ownerId: string): Promise<Deal[]> {
  const dealsQuery = query(collection(db, "deals"), where("ownerId", "==", ownerId));
  const snapshots = await getDocs(dealsQuery);
  return snapshots.docs
    .map(toDeal)
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
}

export async function getDeal(ownerId: string, dealId: string): Promise<Deal | null> {
  const snapshot = await getDoc(doc(db, "deals", dealId));
  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    return null;
  }
  return toDeal(snapshot);
}

export async function createDeal(ownerId: string, deal: DealInput): Promise<void> {
  const dealRef = doc(collection(db, "deals"));
  const batch = writeBatch(db);
  batch.set(
    dealRef,
    withoutUndefined({
      ...deal,
      ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  addActivityToBatch(batch, ownerId, {
    type: "deal-created",
    message: `Created deal "${deal.title}".`,
    entityType: "deal",
    entityId: dealRef.id,
    customerId: deal.customerId,
  });
  await batch.commit();
}

export async function updateDeal(
  ownerId: string,
  dealId: string,
  deal: DealInput,
): Promise<void> {
  const dealRef = doc(db, "deals", dealId);
  const snapshot = await getDoc(dealRef);
  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Deal not found or you do not have permission to edit it.");
  }

  const batch = writeBatch(db);
  batch.update(
    dealRef,
    withoutUndefined({
      ...deal,
      updatedAt: serverTimestamp(),
    }),
  );
  addActivityToBatch(batch, ownerId, {
    type: "deal-updated",
    message: `Updated deal "${deal.title}".`,
    entityType: "deal",
    entityId: dealId,
    customerId: deal.customerId,
  });
  await batch.commit();
}

export async function deleteDeal(ownerId: string, dealId: string): Promise<void> {
  const dealRef = doc(db, "deals", dealId);
  const snapshot = await getDoc(dealRef);
  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Deal not found or you do not have permission to delete it.");
  }

  const data = snapshot.data();
  const batch = writeBatch(db);
  batch.delete(dealRef);
  addActivityToBatch(batch, ownerId, {
    type: "deal-deleted",
    message: `Deleted deal "${data.title}".`,
    entityType: "deal",
    entityId: dealId,
    customerId: data.customerId,
  });
  await batch.commit();
}
