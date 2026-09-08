"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
/**
 * The Firestore handle the AI pipeline writes through. Re-exported from
 * lib/db so the whole functions codebase shares one admin.firestore() call.
 */
var db_1 = require("../lib/db");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return db_1.db; } });
//# sourceMappingURL=firestoreDb.js.map