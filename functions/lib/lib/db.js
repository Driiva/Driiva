"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
/**
 * The Firestore handle the trip pipeline writes through, in its own module so
 * the modules that were split out of triggers/trips.ts and ai/tripAnalysis.ts
 * share the single getFirestore() call each of those files used to make at
 * import time.
 */
const firestore_1 = require("firebase-admin/firestore");
exports.db = (0, firestore_1.getFirestore)();
//# sourceMappingURL=db.js.map