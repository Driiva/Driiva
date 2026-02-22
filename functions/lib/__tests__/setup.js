"use strict";
/**
 * GLOBAL TEST SETUP
 * =================
 * Mocks Firebase Admin SDK so unit tests run without real Firestore/Firebase.
 * All individual test files can override these mocks as needed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockFieldValue = exports.mockTimestamp = exports.mockDb = exports.mockRunTransaction = exports.mockBatchCommit = exports.mockBatchDelete = exports.mockBatchUpdate = exports.mockBatchSet = exports.mockGetAll = exports.mockLimit = exports.mockOrderBy = exports.mockWhere = exports.mockAdd = exports.mockDelete = exports.mockUpdate = exports.mockSet = exports.mockGet = void 0;
const vitest_1 = require("vitest");
// ---------------------------------------------------------------------------
// Firebase Admin mock — must be hoisted before any imports that use admin
// ---------------------------------------------------------------------------
const mockTimestamp = {
    toDate: () => new Date(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
};
exports.mockTimestamp = mockTimestamp;
const mockFieldValue = {
    serverTimestamp: () => ({ _type: 'SERVER_TIMESTAMP' }),
    arrayUnion: (...items) => ({ _type: 'ARRAY_UNION', items }),
    arrayRemove: (...items) => ({ _type: 'ARRAY_REMOVE', items }),
    increment: (n) => ({ _type: 'INCREMENT', n }),
    delete: () => ({ _type: 'DELETE' }),
};
exports.mockFieldValue = mockFieldValue;
// Build a chainable Firestore mock
exports.mockGet = vitest_1.vi.fn();
exports.mockSet = vitest_1.vi.fn().mockResolvedValue(undefined);
exports.mockUpdate = vitest_1.vi.fn().mockResolvedValue(undefined);
exports.mockDelete = vitest_1.vi.fn().mockResolvedValue(undefined);
exports.mockAdd = vitest_1.vi.fn().mockResolvedValue({ id: 'auto-id-123' });
exports.mockWhere = vitest_1.vi.fn();
exports.mockOrderBy = vitest_1.vi.fn();
exports.mockLimit = vitest_1.vi.fn();
exports.mockGetAll = vitest_1.vi.fn();
exports.mockBatchSet = vitest_1.vi.fn();
exports.mockBatchUpdate = vitest_1.vi.fn();
exports.mockBatchDelete = vitest_1.vi.fn();
exports.mockBatchCommit = vitest_1.vi.fn().mockResolvedValue(undefined);
exports.mockRunTransaction = vitest_1.vi.fn();
const docRef = (path) => ({
    id: path?.split('/').pop() ?? 'mock-doc-id',
    path: path ?? 'mock/doc',
    get: exports.mockGet,
    set: exports.mockSet,
    update: exports.mockUpdate,
    delete: exports.mockDelete,
    collection: vitest_1.vi.fn((sub) => collectionRef(`${path}/${sub}`)),
});
const collectionRef = (path) => ({
    doc: vitest_1.vi.fn((id) => docRef(`${path}/${id}`)),
    add: exports.mockAdd,
    where: exports.mockWhere.mockReturnThis(),
    orderBy: exports.mockOrderBy.mockReturnThis(),
    limit: exports.mockLimit.mockReturnThis(),
    get: exports.mockGet,
});
const mockBatch = {
    set: exports.mockBatchSet,
    update: exports.mockBatchUpdate,
    delete: exports.mockBatchDelete,
    commit: exports.mockBatchCommit,
};
const mockDb = {
    collection: vitest_1.vi.fn((path) => collectionRef(path)),
    doc: vitest_1.vi.fn((path) => docRef(path)),
    batch: vitest_1.vi.fn(() => mockBatch),
    runTransaction: exports.mockRunTransaction,
    getAll: exports.mockGetAll,
};
exports.mockDb = mockDb;
vitest_1.vi.mock('firebase-admin', () => ({
    default: {
        initializeApp: vitest_1.vi.fn(),
        firestore: vitest_1.vi.fn(() => mockDb),
        auth: vitest_1.vi.fn(() => ({
            getUser: vitest_1.vi.fn(),
            deleteUser: vitest_1.vi.fn(),
            revokeRefreshTokens: vitest_1.vi.fn(),
        })),
        apps: [{}],
    },
    initializeApp: vitest_1.vi.fn(),
    firestore: Object.assign(vitest_1.vi.fn(() => mockDb), {
        Timestamp: {
            now: () => mockTimestamp,
            fromDate: (d) => ({
                ...mockTimestamp,
                seconds: Math.floor(d.getTime() / 1000),
                toDate: () => d,
            }),
            fromMillis: (ms) => ({
                ...mockTimestamp,
                seconds: Math.floor(ms / 1000),
                toDate: () => new Date(ms),
            }),
        },
        FieldValue: mockFieldValue,
    }),
    auth: vitest_1.vi.fn(() => ({
        getUser: vitest_1.vi.fn(),
        deleteUser: vitest_1.vi.fn(),
        revokeRefreshTokens: vitest_1.vi.fn(),
    })),
}));
vitest_1.vi.mock('firebase-functions', () => ({
    default: {
        logger: {
            info: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
            debug: vitest_1.vi.fn(),
        },
        firestore: {
            document: vitest_1.vi.fn(() => ({
                onCreate: vitest_1.vi.fn((handler) => handler),
                onUpdate: vitest_1.vi.fn((handler) => handler),
                onWrite: vitest_1.vi.fn((handler) => handler),
                onDelete: vitest_1.vi.fn((handler) => handler),
            })),
        },
        pubsub: {
            schedule: vitest_1.vi.fn(() => ({
                onRun: vitest_1.vi.fn((handler) => handler),
            })),
        },
        https: {
            onCall: vitest_1.vi.fn((handler) => handler),
            onRequest: vitest_1.vi.fn((handler) => handler),
            HttpsError: class HttpsError extends Error {
                constructor(code, message) {
                    super(message);
                    this.code = code;
                }
            },
        },
        region: vitest_1.vi.fn(() => ({
            firestore: {
                document: vitest_1.vi.fn(() => ({
                    onWrite: vitest_1.vi.fn((handler) => handler),
                    onCreate: vitest_1.vi.fn((handler) => handler),
                    onUpdate: vitest_1.vi.fn((handler) => handler),
                })),
            },
            https: {
                onCall: vitest_1.vi.fn((handler) => handler),
            },
        })),
    },
    logger: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn(),
    },
    firestore: {
        document: vitest_1.vi.fn(() => ({
            onCreate: vitest_1.vi.fn((handler) => handler),
            onUpdate: vitest_1.vi.fn((handler) => handler),
            onWrite: vitest_1.vi.fn((handler) => handler),
        })),
    },
    https: {
        onCall: vitest_1.vi.fn((handler) => handler),
        onRequest: vitest_1.vi.fn((handler) => handler),
        HttpsError: class HttpsError extends Error {
            constructor(code, message) {
                super(message);
                this.code = code;
            }
        },
    },
    pubsub: {
        schedule: vitest_1.vi.fn(() => ({
            onRun: vitest_1.vi.fn((handler) => handler),
        })),
    },
}));
//# sourceMappingURL=setup.js.map