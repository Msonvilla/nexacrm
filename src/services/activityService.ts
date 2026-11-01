import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type WriteBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { ActivityItem } from "../types";

export type ActivityEventInput = Pick<ActivityItem, "type" | "message"> & {
  entityType: "customer" | "deal" | "task";
  entityId: string;
  customerId?: string;
};

function toActivity(snapshot: DocumentSnapshot<DocumentData>): ActivityItem {
  const data = snapshot.data();
  if (!data) {
    throw new Error(`Activity ${snapshot.id} has no data.`);
  }

  const createdAt = data.createdAt;
  const updatedAt = data.updatedAt;
  if (!(createdAt instanceof Timestamp) || !(updatedAt instanceof Timestamp)) {
    throw new Error(`Activity ${snapshot.id} has invalid timestamps.`);
  }

  return {
    id: snapshot.id,
    ownerId: data.ownerId,
    type: data.type,
    message: data.message,
    entityType: data.entityType,
    entityId: data.entityId,
    customerId: data.customerId,
    createdAt: createdAt.toDate().toISOString(),
    updatedAt: updatedAt.toDate().toISOString(),
  };
}

export function addActivityToBatch(
  batch: WriteBatch,
  ownerId: string,
  activity: ActivityEventInput,
): void {
  const activityRef = doc(collection(db, "activities"));
  const data = Object.fromEntries(
    Object.entries({
      ...activity,
      ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).filter(([, value]) => value !== undefined),
  );
  batch.set(activityRef, data);
}

export async function listRecentActivities(ownerId: string): Promise<ActivityItem[]> {
  const activitiesQuery = query(
    collection(db, "activities"),
    where("ownerId", "==", ownerId),
  );
  const snapshots = await getDocs(activitiesQuery);

  return snapshots.docs
    .map(toActivity)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .slice(0, 10);
}
