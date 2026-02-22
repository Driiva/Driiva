/**
 * GLOBAL TEST SETUP
 * =================
 * Mocks Firebase Admin SDK so unit tests run without real Firestore/Firebase.
 * All individual test files can override these mocks as needed.
 */
declare const mockTimestamp: {
    toDate: () => Date;
    seconds: number;
    nanoseconds: number;
};
declare const mockFieldValue: {
    serverTimestamp: () => {
        _type: string;
    };
    arrayUnion: (...items: unknown[]) => {
        _type: string;
        items: unknown[];
    };
    arrayRemove: (...items: unknown[]) => {
        _type: string;
        items: unknown[];
    };
    increment: (n: number) => {
        _type: string;
        n: number;
    };
    delete: () => {
        _type: string;
    };
};
export declare const mockGet: import("vitest").Mock<any, any>;
export declare const mockSet: import("vitest").Mock<any, any>;
export declare const mockUpdate: import("vitest").Mock<any, any>;
export declare const mockDelete: import("vitest").Mock<any, any>;
export declare const mockAdd: import("vitest").Mock<any, any>;
export declare const mockWhere: import("vitest").Mock<any, any>;
export declare const mockOrderBy: import("vitest").Mock<any, any>;
export declare const mockLimit: import("vitest").Mock<any, any>;
export declare const mockGetAll: import("vitest").Mock<any, any>;
export declare const mockBatchSet: import("vitest").Mock<any, any>;
export declare const mockBatchUpdate: import("vitest").Mock<any, any>;
export declare const mockBatchDelete: import("vitest").Mock<any, any>;
export declare const mockBatchCommit: import("vitest").Mock<any, any>;
export declare const mockRunTransaction: import("vitest").Mock<any, any>;
declare const mockDb: {
    collection: import("vitest").Mock<[path: string], any>;
    doc: import("vitest").Mock<[path: string], any>;
    batch: import("vitest").Mock<[], {
        set: import("vitest").Mock<any, any>;
        update: import("vitest").Mock<any, any>;
        delete: import("vitest").Mock<any, any>;
        commit: import("vitest").Mock<any, any>;
    }>;
    runTransaction: import("vitest").Mock<any, any>;
    getAll: import("vitest").Mock<any, any>;
};
export { mockDb, mockTimestamp, mockFieldValue };
//# sourceMappingURL=setup.d.ts.map