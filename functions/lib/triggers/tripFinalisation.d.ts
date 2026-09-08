import { TripDocument, TripPoint } from '../types';
/**
 * Finalize trip by reading GPS points and computing metrics
 *
 * Steps:
 * 1. Read all points from tripPoints/{tripId}
 * 2. Compute duration, distance (Haversine), average speed
 * 3. Compute driving score from events
 * 4. Update trip document with computed metrics
 * 5. Detect anomalies and set final status
 * 6. Update driver stats transactionally
 */
export declare function finalizeTripFromPoints(tripId: string, tripData: TripDocument): Promise<void>;
/**
 * Read all GPS points for a trip
 * Handles both single-document and batched storage
 */
export declare function readTripPoints(tripId: string): Promise<TripPoint[]>;
//# sourceMappingURL=tripFinalisation.d.ts.map