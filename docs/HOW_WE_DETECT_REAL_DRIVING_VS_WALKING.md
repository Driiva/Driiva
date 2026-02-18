# How we detect real driving vs walking

*Investor-grade summary — suitable for pitch deck or product one-pagers.*

---

Driiva uses telematics (GPS and phone sensors) to score how people drive. A core question is: **when is the user actually driving, and when are they walking, parked, or in another mode?**

We answer that with a **trip classifier** that splits a raw GPS trace into **stops** (dwelling: walking, waiting, parked) and **trips** (real driving segments). Only the latter are used for scoring and insurance logic.

---

## What we do in one sentence

We run every finished GPS recording through a **stop–go classifier**: it labels each point as “stopped” or “moving” and outputs **driving segments** (start time, end time, duration). Those segments are our **real driving**; everything else (stops, short moves) is treated as non-driving.

---

## How it works (high level)

1. **Input:** A time-ordered list of GPS points (latitude, longitude, timestamp) from the user’s phone during a “trip” (e.g. from app start to app stop).

2. **Coordinate conversion:** We convert lat/lng to local planar coordinates (meters) so we can work with distances and speeds in a consistent way.

3. **Classification:** Our classifier (based on published research from TU Berlin) uses several signals to decide, for each small window of the trace, whether the user was **dwelling** (stop) or **in transit** (trip):
   - **Motion score** — how much movement there is in a window.
   - **Rectangle distance ratio** — how much the path “fans out” vs a simple straight line (walking often looks more meandering; driving is more direct).
   - **Bearing analysis** — consistency of direction (driving is more directional).
   - **Start–end distance** — how far the start and end of a window are (short distance with long path suggests dwelling or walking in a small area).
   - **Intersecting segments** — whether the path crosses itself (more typical of walking or complex manoeuvres than highway driving).

4. **Output:**  
   - **Stops:** intervals where the user stayed in a small area (e.g. walking or parked).  
   - **Trips:** intervals of sustained movement that we treat as **real driving**.  
   We store these in our Firebase schema (e.g. `tripSegments/{tripId}`) and optionally attach a summary to the trip document.

5. **Downstream use:** Scoring, premiums, and refunds are based on these **driving segments** only. Stops and non-driving movement do not affect the user’s driving score.

---

## Where it lives in our stack

- **Algorithm:** Python Stop-Go-Classifier in `functions-python/` (deployed as its own Cloud Function).
- **Orchestration:** Our main backend (Firebase Cloud Functions) sends trip GPS data to the classifier over HTTP and writes the results into Firestore.
- **Data model:** Firebase collections `trips`, `tripPoints`, and `tripSegments` (and related fields) hold the raw trace and the classifier’s driving-vs-stop output.

---

## Why it’s credible

- The classifier is based on **peer-reviewed work** (Spang et al., FOSS4G) for stop and trip classification in GPS trajectories.
- We use **multiple geometric and motion features**, not just speed, so we can separate low-speed driving from walking and short stops.
- **Deterministic and auditable:** same GPS trace produces the same segments; we don’t modify historical trip data after creation.

---

*This explanation is derived from the trip classifier implementation and the Firebase schema. For technical details, see `functions-python/stop_go_classifier.py`, `functions/src/http/classifier.ts`, and `shared/firestore-types.ts`.*
