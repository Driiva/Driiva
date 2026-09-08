"use strict";
/**
 * SHARED TYPES FOR CLOUD FUNCTIONS
 * ================================
 * Mirrors the shared/firestore-types.ts from the main app.
 * Keep in sync with the client types.
 *
 * The definitions live one module per collection group under
 * functions/src/schema; this file is the barrel every existing import already
 * points at, so the exported surface is unchanged.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./schema/firestoreScalars"), exports);
__exportStar(require("./schema/enums"), exports);
__exportStar(require("./schema/documents"), exports);
__exportStar(require("./schema/tripPoints"), exports);
__exportStar(require("./schema/segmentation"), exports);
__exportStar(require("./schema/aiInsights"), exports);
//# sourceMappingURL=types.js.map