#!/usr/bin/env node
/**
 * delete-user.js
 * Deletes a user from Firebase Auth AND all associated Firestore documents.
 *
 * Usage:
 *   node scripts/delete-user.js jamal@driiva.co.uk
 *
 * Prerequisites:
 *   firebase login --reauth   (so ADC credentials are fresh)
 */

const admin = require("../functions/node_modules/firebase-admin");

const EMAIL = process.argv[2];

if (!EMAIL) {
  console.error("Usage: node scripts/delete-user.js <email>");
  process.exit(1);
}

admin.initializeApp({ projectId: "driiva" });
const auth = admin.auth();
const db = admin.firestore();

async function deleteCollection(collectionPath, uid) {
  const snap = await db
    .collection(collectionPath)
    .where("userId", "==", uid)
    .get();
  if (snap.empty) {
    console.log(`  [skip] ${collectionPath} — no docs for this user`);
    return;
  }
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`  [deleted] ${collectionPath} — ${snap.size} doc(s)`);
}

async function deleteSubcollections(tripIds) {
  for (const tripId of tripIds) {
    for (const sub of ["batches"]) {
      const snap = await db
        .collection("tripPoints")
        .doc(tripId)
        .collection(sub)
        .get();
      if (!snap.empty) {
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        console.log(
          `  [deleted] tripPoints/${tripId}/${sub} — ${snap.size} doc(s)`
        );
      }
    }
    // delete the tripPoints parent doc itself
    await db.collection("tripPoints").doc(tripId).delete();
    console.log(`  [deleted] tripPoints/${tripId}`);
    // delete tripSegments
    await db.collection("tripSegments").doc(tripId).delete();
    console.log(`  [deleted] tripSegments/${tripId}`);
  }
}

async function main() {
  console.log(`\nLooking up Firebase Auth user: ${EMAIL}`);

  let uid;
  try {
    const user = await auth.getUserByEmail(EMAIL);
    uid = user.uid;
    console.log(`  Found UID: ${uid}`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      console.log("  Auth user not found — skipping Auth deletion.");
    } else {
      throw err;
    }
  }

  if (uid) {
    // Collect trip IDs before deleting trips
    const tripSnap = await db
      .collection("trips")
      .where("userId", "==", uid)
      .get();
    const tripIds = tripSnap.docs.map((d) => d.id);
    console.log(`  Found ${tripIds.length} trip(s)`);

    // Delete trips
    if (!tripSnap.empty) {
      const batch = db.batch();
      tripSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      console.log(`  [deleted] trips — ${tripSnap.size} doc(s)`);
    }

    // Delete tripPoints + tripSegments per trip
    await deleteSubcollections(tripIds);

    // Delete other user-scoped collections
    await deleteCollection("policies", uid);
    await deleteCollection("poolShares", uid);

    // Delete user doc
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      await userRef.delete();
      console.log(`  [deleted] users/${uid}`);
    } else {
      console.log(`  [skip] users/${uid} — doc does not exist`);
    }

    // Delete Auth user
    await auth.deleteUser(uid);
    console.log(`  [deleted] Auth user ${EMAIL} (${uid})`);
  }

  console.log(`\nDone. ${EMAIL} has been wiped from Firestore and Auth.\n`);
}

main().catch((err) => {
  console.error("\nFailed:", err.message);
  process.exit(1);
});
