# NexaCRM

NexaCRM is a React, TypeScript, Vite, and Firebase CRM starter.

## Run locally

1. Copy `.env.example` to `.env` and add the Firebase web app configuration.
2. Enable Email/Password sign-in and create a Cloud Firestore database in the Firebase project.
3. Publish the rules in `firestore.rules` to that Firestore database. You can paste them into the Firebase Console under **Firestore Database → Rules**.
4. Install dependencies with `npm install`, then run `npm run dev`.

The customer list and customer create/edit form use Firestore. Customer documents are stored in the `customers` collection and include `ownerId`, `firstName`, `lastName`, `email`, `status`, `value`, `createdAt`, and `updatedAt`; `phone`, `company`, and `notes` are optional.

The deals pipeline and create/edit form also use Firestore. Deal documents in `deals` include `ownerId`, `customerId`, `title`, `stage`, `amount`, `createdAt`, and `updatedAt`; `closeDate` and `notes` are optional. A deal must reference a customer owned by the same signed-in user. The rules in `firestore.rules` enforce owner-scoped reads and writes for both collections.

Tasks are stored in the `tasks` collection and include `ownerId`, `assigneeId`, `title`, `status`, `createdAt`, and `updatedAt`; `dueDate` and `relatedCustomerId` are optional. Tasks can only be assigned to their owner, and linked customers must also belong to that owner.

The dashboard reads the signed-in user's customers, deals, and tasks from Firestore. It also shows recent activity from the `activities` collection. Creating or updating a customer, deal, or task writes an immutable activity record in the same Firestore batch as the record change. Activity records are owner-scoped and contain `ownerId`, `type`, `message`, `entityType`, `entityId`, `createdAt`, and `updatedAt`; `customerId` is optional. Publish the latest `firestore.rules` so the app can read and write this collection.

Customers, deals, and tasks can be deleted after confirmation. A customer cannot be deleted while it has linked deals or tasks; remove those records first to avoid leaving broken references. Delete events are also recorded in the activity feed, so publish the latest `firestore.rules` to allow the new activity types.

## Checks

- `npm test`
- `npm run lint`
- `npm run build`

The UI tests mock Firebase data services and cover customer search/create/delete, deal display/create/delete, and task status/create/delete flows. They do not connect to the configured Firebase project.
