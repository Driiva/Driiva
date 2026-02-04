"""
Driiva Refund Calculator API
FastAPI application for calculating driver refunds based on driving scores and pool safety.
Includes mock risk scoring service that simulates XGBoost behavior.
"""

import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# Initialize FastAPI app
app = FastAPI(
    title="Driiva Refund Calculator API",
    description="Calculate driver refunds based on personal driving scores, pool safety factors, and surplus ratios.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firestore client (will be initialized lazily if credentials are available)
_db = None
_firestore_initialized = False

def get_db():
    """Get Firestore client, initializing lazily if needed."""
    global _db, _firestore_initialized
    
    if _firestore_initialized:
        return _db
    
    _firestore_initialized = True
    
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Check if already initialized
        try:
            firebase_admin.get_app()
        except ValueError:
            # Check for service account key in environment
            service_account_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if service_account_path and os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
            else:
                # No credentials available
                print("Firestore credentials not found")
                return None
        
        _db = firestore.client()
        print("Firestore initialized successfully")
    except Exception as e:
        print(f"Firestore not available: {e}")
        _db = None
    
    return _db


# ============ Pydantic Models ============

class RefundRequest(BaseModel):
    """Request model for single driver refund calculation."""
    personal_score: float = Field(..., ge=0, le=100, description="Individual driver's annual driving score (0-100)")
    pool_safety_factor: float = Field(..., ge=0, le=1, description="Percentage of drivers with score ≥80 (0-1)")
    surplus_ratio: float = Field(..., ge=0, description="Total surplus / Target refund pool (capped at 1)")
    annual_premium: float = Field(..., gt=0, description="Driver's yearly premium in GBP")

    @field_validator('surplus_ratio')
    @classmethod
    def cap_surplus_ratio(cls, v):
        """Cap surplus_ratio at 1."""
        return min(v, 1.0)


class RefundResponse(BaseModel):
    """Response model for refund calculation."""
    eligible: bool = Field(..., description="Whether the driver is eligible for a refund")
    refund_rate: float = Field(..., description="The calculated refund rate (0-0.15)")
    refund_amount: float = Field(..., description="The refund amount in GBP")
    net_cost: float = Field(..., description="Net cost after refund (annual_premium - refund_amount)")


class DriverInput(BaseModel):
    """Input model for a driver in batch calculation."""
    driver_id: str = Field(..., description="Unique identifier for the driver")
    personal_score: float = Field(..., ge=0, le=100, description="Individual driver's annual driving score (0-100)")
    annual_premium: float = Field(..., gt=0, description="Driver's yearly premium in GBP")


class BatchRefundRequest(BaseModel):
    """Request model for batch refund calculation."""
    drivers: List[DriverInput] = Field(..., description="List of drivers to calculate refunds for")
    pool_safety_factor: Optional[float] = Field(None, ge=0, le=1, description="Override pool safety factor (0-1). If not provided, calculated from Firestore.")
    surplus_ratio: float = Field(..., ge=0, description="Total surplus / Target refund pool (capped at 1)")

    @field_validator('surplus_ratio')
    @classmethod
    def cap_surplus_ratio(cls, v):
        """Cap surplus_ratio at 1."""
        return min(v, 1.0)


class DriverRefundResult(BaseModel):
    """Result model for a single driver in batch calculation."""
    driver_id: str
    eligible: bool
    refund_rate: float
    refund_amount: float
    net_cost: float
    personal_score: float
    annual_premium: float


class BatchRefundResponse(BaseModel):
    """Response model for batch refund calculation."""
    pool_safety_factor: float = Field(..., description="The pool safety factor used in calculations")
    surplus_ratio: float = Field(..., description="The surplus ratio used in calculations")
    total_refund_amount: float = Field(..., description="Total refund amount for all eligible drivers")
    eligible_count: int = Field(..., description="Number of eligible drivers")
    total_count: int = Field(..., description="Total number of drivers")
    results: List[DriverRefundResult] = Field(..., description="Individual refund results for each driver")


class DriverScore(BaseModel):
    """Model for storing/retrieving driver scores."""
    driver_id: str = Field(..., description="Unique identifier for the driver")
    personal_score: float = Field(..., ge=0, le=100, description="Driver's annual driving score")
    annual_premium: float = Field(..., gt=0, description="Driver's yearly premium in GBP")


class PoolStats(BaseModel):
    """Model for pool statistics."""
    total_drivers: int
    drivers_above_80: int
    pool_safety_factor: float
    average_score: float


# ============ Core Calculation Logic ============

def calculate_refund(
    personal_score: float,
    pool_safety_factor: float,
    surplus_ratio: float,
    annual_premium: float
) -> RefundResponse:
    """
    Calculate the refund for a single driver.
    
    Logic:
    - refund_rate = min(0.15, ((0.7 * personal_score/100) + (0.3 * pool_safety_factor)) * surplus_ratio)
    - refund_amount = annual_premium * refund_rate
    
    Rules:
    - Only drivers with personal_score >= 70 are eligible
    - Refund rate capped at 15% maximum
    """
    # Cap surplus_ratio at 1
    surplus_ratio = min(surplus_ratio, 1.0)
    
    # Check eligibility
    eligible = personal_score >= 70
    
    if not eligible:
        return RefundResponse(
            eligible=False,
            refund_rate=0.0,
            refund_amount=0.0,
            net_cost=annual_premium
        )
    
    # Calculate refund rate
    raw_rate = ((0.7 * personal_score / 100) + (0.3 * pool_safety_factor)) * surplus_ratio
    refund_rate = min(0.15, raw_rate)
    
    # Calculate refund amount
    refund_amount = round(annual_premium * refund_rate, 2)
    
    # Calculate net cost
    net_cost = round(annual_premium - refund_amount, 2)
    
    return RefundResponse(
        eligible=True,
        refund_rate=round(refund_rate, 4),
        refund_amount=refund_amount,
        net_cost=net_cost
    )


def calculate_pool_safety_factor(scores: List[float]) -> float:
    """Calculate the pool safety factor from a list of scores."""
    if not scores:
        return 0.0
    drivers_above_80 = sum(1 for score in scores if score >= 80)
    return round(drivers_above_80 / len(scores), 4)


# ============ API Endpoints ============

@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Driiva Refund Calculator API",
        "version": "1.0.0",
        "firestore_connected": get_db() is not None
    }


@app.post("/calculate-refund", response_model=RefundResponse, tags=["Refund Calculator"])
async def calculate_single_refund(request: RefundRequest):
    """
    Calculate refund for a single driver.
    
    - **personal_score**: Individual driver's annual driving score (0-100)
    - **pool_safety_factor**: Percentage of drivers with score ≥80 (0-1)
    - **surplus_ratio**: Total surplus / Target refund pool (capped at 1)
    - **annual_premium**: Driver's yearly premium in GBP
    
    Returns eligibility status, refund rate, refund amount, and net cost.
    """
    return calculate_refund(
        personal_score=request.personal_score,
        pool_safety_factor=request.pool_safety_factor,
        surplus_ratio=request.surplus_ratio,
        annual_premium=request.annual_premium
    )


@app.post("/calculate-pool-refunds", response_model=BatchRefundResponse, tags=["Refund Calculator"])
async def calculate_batch_refunds(request: BatchRefundRequest):
    """
    Calculate refunds for a batch of drivers.
    
    - **drivers**: List of drivers with driver_id, personal_score, and annual_premium
    - **pool_safety_factor**: Optional override. If not provided, calculated from the batch.
    - **surplus_ratio**: Total surplus / Target refund pool (capped at 1)
    
    Returns individual results for each driver plus aggregate statistics.
    """
    if not request.drivers:
        raise HTTPException(status_code=400, detail="At least one driver is required")
    
    # Calculate pool safety factor from batch if not provided
    if request.pool_safety_factor is not None:
        pool_safety_factor = request.pool_safety_factor
    else:
        scores = [driver.personal_score for driver in request.drivers]
        pool_safety_factor = calculate_pool_safety_factor(scores)
    
    # Calculate refunds for each driver
    results = []
    total_refund = 0.0
    eligible_count = 0
    
    for driver in request.drivers:
        refund_result = calculate_refund(
            personal_score=driver.personal_score,
            pool_safety_factor=pool_safety_factor,
            surplus_ratio=request.surplus_ratio,
            annual_premium=driver.annual_premium
        )
        
        results.append(DriverRefundResult(
            driver_id=driver.driver_id,
            eligible=refund_result.eligible,
            refund_rate=refund_result.refund_rate,
            refund_amount=refund_result.refund_amount,
            net_cost=refund_result.net_cost,
            personal_score=driver.personal_score,
            annual_premium=driver.annual_premium
        ))
        
        if refund_result.eligible:
            total_refund += refund_result.refund_amount
            eligible_count += 1
    
    return BatchRefundResponse(
        pool_safety_factor=pool_safety_factor,
        surplus_ratio=min(request.surplus_ratio, 1.0),
        total_refund_amount=round(total_refund, 2),
        eligible_count=eligible_count,
        total_count=len(request.drivers),
        results=results
    )


# ============ Firestore Endpoints ============

@app.post("/drivers", tags=["Driver Management"])
async def store_driver_score(driver: DriverScore):
    """
    Store or update a driver's score in Firestore.
    
    - **driver_id**: Unique identifier for the driver
    - **personal_score**: Driver's annual driving score (0-100)
    - **annual_premium**: Driver's yearly premium in GBP
    """
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503, 
            detail="Firestore not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable."
        )
    
    try:
        doc_ref = db.collection("drivers").document(driver.driver_id)
        doc_ref.set({
            "driver_id": driver.driver_id,
            "personal_score": driver.personal_score,
            "annual_premium": driver.annual_premium
        })
        return {"status": "success", "driver_id": driver.driver_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/drivers/{driver_id}", tags=["Driver Management"])
async def get_driver_score(driver_id: str):
    """
    Retrieve a driver's score from Firestore.
    """
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Firestore not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable."
        )
    
    try:
        doc_ref = db.collection("drivers").document(driver_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"Driver {driver_id} not found")
        return doc.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/drivers", tags=["Driver Management"])
async def list_all_drivers():
    """
    List all drivers from Firestore.
    """
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Firestore not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable."
        )
    
    try:
        drivers_ref = db.collection("drivers")
        docs = drivers_ref.stream()
        drivers = [doc.to_dict() for doc in docs]
        return {"drivers": drivers, "count": len(drivers)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/drivers/{driver_id}", tags=["Driver Management"])
async def delete_driver(driver_id: str):
    """
    Delete a driver from Firestore.
    """
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Firestore not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable."
        )
    
    try:
        doc_ref = db.collection("drivers").document(driver_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"Driver {driver_id} not found")
        doc_ref.delete()
        return {"status": "deleted", "driver_id": driver_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pool-stats", response_model=PoolStats, tags=["Pool Statistics"])
async def get_pool_statistics():
    """
    Get real-time pool statistics from Firestore.
    
    Returns:
    - Total number of drivers
    - Number of drivers with score >= 80
    - Pool safety factor (percentage of drivers with score >= 80)
    - Average score across all drivers
    """
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Firestore not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable."
        )
    
    try:
        drivers_ref = db.collection("drivers")
        docs = drivers_ref.stream()
        
        scores = []
        for doc in docs:
            data = doc.to_dict()
            if "personal_score" in data:
                scores.append(data["personal_score"])
        
        if not scores:
            return PoolStats(
                total_drivers=0,
                drivers_above_80=0,
                pool_safety_factor=0.0,
                average_score=0.0
            )
        
        drivers_above_80 = sum(1 for score in scores if score >= 80)
        
        return PoolStats(
            total_drivers=len(scores),
            drivers_above_80=drivers_above_80,
            pool_safety_factor=round(drivers_above_80 / len(scores), 4),
            average_score=round(sum(scores) / len(scores), 2)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate-pool-refunds-from-firestore", response_model=BatchRefundResponse, tags=["Refund Calculator"])
async def calculate_refunds_from_firestore(surplus_ratio: float = 0.5):
    """
    Calculate refunds for all drivers stored in Firestore.
    
    Uses real-time pool_safety_factor calculated from all stored driver scores.
    
    - **surplus_ratio**: Total surplus / Target refund pool (capped at 1)
    """
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Firestore not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable."
        )
    
    try:
        # Get all drivers from Firestore
        drivers_ref = db.collection("drivers")
        docs = drivers_ref.stream()
        
        drivers_data = []
        for doc in docs:
            data = doc.to_dict()
            if all(k in data for k in ["driver_id", "personal_score", "annual_premium"]):
                drivers_data.append(data)
        
        if not drivers_data:
            raise HTTPException(status_code=404, detail="No drivers found in Firestore")
        
        # Calculate pool safety factor
        scores = [d["personal_score"] for d in drivers_data]
        pool_safety_factor = calculate_pool_safety_factor(scores)
        
        # Cap surplus ratio
        surplus_ratio = min(surplus_ratio, 1.0)
        
        # Calculate refunds
        results = []
        total_refund = 0.0
        eligible_count = 0
        
        for driver in drivers_data:
            refund_result = calculate_refund(
                personal_score=driver["personal_score"],
                pool_safety_factor=pool_safety_factor,
                surplus_ratio=surplus_ratio,
                annual_premium=driver["annual_premium"]
            )
            
            results.append(DriverRefundResult(
                driver_id=driver["driver_id"],
                eligible=refund_result.eligible,
                refund_rate=refund_result.refund_rate,
                refund_amount=refund_result.refund_amount,
                net_cost=refund_result.net_cost,
                personal_score=driver["personal_score"],
                annual_premium=driver["annual_premium"]
            ))
            
            if refund_result.eligible:
                total_refund += refund_result.refund_amount
                eligible_count += 1
        
        return BatchRefundResponse(
            pool_safety_factor=pool_safety_factor,
            surplus_ratio=surplus_ratio,
            total_refund_amount=round(total_refund, 2),
            eligible_count=eligible_count,
            total_count=len(drivers_data),
            results=results
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ Trip Scoring Models (Mock XGBoost) ============

class TripInput(BaseModel):
    """Input model for a single trip to be scored."""
    driver_id: str = Field(..., description="Unique identifier for the driver")
    harsh_brakes: int = Field(default=0, ge=0, description="Count of harsh braking events")
    speeding_incidents: int = Field(default=0, ge=0, description="Count of speeding incidents")
    night_driving_minutes: int = Field(default=0, ge=0, description="Minutes of night driving")
    phone_usage_minutes: int = Field(default=0, ge=0, description="Minutes of phone usage while driving")
    speed_variance: float = Field(default=0, ge=0, le=100, description="Speed variance on 0-100 scale")
    trip_distance_km: float = Field(default=0, ge=0, description="Trip distance in kilometers")
    trip_date: Optional[str] = Field(default=None, description="Trip date (YYYY-MM-DD format). Defaults to today.")

    @field_validator('trip_date')
    @classmethod
    def validate_trip_date(cls, v):
        """Validate and normalize trip_date to YYYY-MM-DD format."""
        if v is None:
            return None
        try:
            parsed = datetime.strptime(v, "%Y-%m-%d")
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            raise ValueError("trip_date must be in YYYY-MM-DD format")


class ScoreBreakdown(BaseModel):
    """Breakdown of penalties applied to the score."""
    base_score: float = Field(default=100.0, description="Starting base score")
    harsh_brake_penalty: float = Field(..., description="Penalty for harsh braking")
    speeding_penalty: float = Field(..., description="Penalty for speeding incidents")
    night_penalty: float = Field(..., description="Penalty for night driving")
    phone_penalty: float = Field(..., description="Penalty for phone usage")
    variance_penalty: float = Field(..., description="Penalty for speed variance")
    total_penalty: float = Field(..., description="Sum of all penalties")


class TripScoreResponse(BaseModel):
    """Response model for trip scoring."""
    driver_id: str
    trip_date: str
    daily_score: float = Field(..., description="Score for this trip (0-100)")
    rolling_avg: float = Field(..., description="30-day rolling average score")
    breakdown: ScoreBreakdown
    trips_in_period: int = Field(..., description="Number of trips in the 30-day period")


class BatchTripInput(BaseModel):
    """Input model for batch trip scoring."""
    trips: List[TripInput] = Field(..., description="List of trips to score")


class BatchTripScoreResponse(BaseModel):
    """Response model for batch trip scoring."""
    processed_count: int
    results: List[TripScoreResponse]
    errors: List[str] = Field(default_factory=list)


class DriverScoreResponse(BaseModel):
    """Response model for driver's current score."""
    driver_id: str
    current_score: float = Field(..., description="Most recent daily score")
    rolling_avg: float = Field(..., description="30-day rolling average score")
    trips_in_period: int = Field(..., description="Number of trips in the 30-day period")
    last_trip_date: Optional[str] = Field(None, description="Date of the most recent trip")
    score_history: List[Dict[str, Any]] = Field(default_factory=list, description="Recent score history")


# ============ Trip Scoring Logic ============

def calculate_trip_score(trip: TripInput) -> tuple[float, ScoreBreakdown]:
    """
    Calculate the score for a single trip using rule-based XGBoost approximation.
    
    Scoring Logic:
    base_score = 100
    harsh_brake_penalty = harsh_brakes * 2
    speeding_penalty = speeding_incidents * 3
    night_penalty = (night_driving_minutes / 60) * 1.5
    phone_penalty = phone_usage_minutes * 4
    variance_penalty = speed_variance * 0.5
    
    final_score = max(0, min(100, base_score - sum(all_penalties)))
    """
    base_score = 100.0
    
    harsh_brake_penalty = trip.harsh_brakes * 2.0
    speeding_penalty = trip.speeding_incidents * 3.0
    night_penalty = (trip.night_driving_minutes / 60.0) * 1.5
    phone_penalty = trip.phone_usage_minutes * 4.0
    variance_penalty = trip.speed_variance * 0.5
    
    total_penalty = (
        harsh_brake_penalty +
        speeding_penalty +
        night_penalty +
        phone_penalty +
        variance_penalty
    )
    
    final_score = max(0.0, min(100.0, base_score - total_penalty))
    
    breakdown = ScoreBreakdown(
        base_score=base_score,
        harsh_brake_penalty=round(harsh_brake_penalty, 2),
        speeding_penalty=round(speeding_penalty, 2),
        night_penalty=round(night_penalty, 2),
        phone_penalty=round(phone_penalty, 2),
        variance_penalty=round(variance_penalty, 2),
        total_penalty=round(total_penalty, 2)
    )
    
    return round(final_score, 2), breakdown


def get_trip_date(trip: TripInput) -> str:
    """Get the trip date, defaulting to today if not provided."""
    if trip.trip_date:
        return trip.trip_date
    return datetime.now().strftime("%Y-%m-%d")


async def store_trip_score(driver_id: str, trip_date: str, score: float, breakdown: ScoreBreakdown) -> None:
    """Store a trip score in Firestore. Raises HTTPException on failure."""
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Firestore not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable."
        )
    
    try:
        doc_ref = db.collection("trip_scores").document(f"{driver_id}_{trip_date}")
        doc_ref.set({
            "driver_id": driver_id,
            "trip_date": trip_date,
            "score": score,
            "breakdown": breakdown.model_dump(),
            "created_at": datetime.now().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store trip score: {str(e)}")


async def get_rolling_average(driver_id: str, days: int = 30, require_db: bool = True) -> tuple[float, int, list]:
    """Get the rolling average score for a driver over the specified number of days."""
    db = get_db()
    if db is None:
        if require_db:
            raise HTTPException(
                status_code=503,
                detail="Firestore not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable."
            )
        return 0.0, 0, []
    
    try:
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        scores_ref = db.collection("trip_scores")
        query = scores_ref.where("driver_id", "==", driver_id).where("trip_date", ">=", cutoff_date)
        docs = query.stream()
        
        scores = []
        history = []
        for doc in docs:
            data = doc.to_dict()
            if data and "score" in data:
                scores.append(data["score"])
                history.append({
                    "date": data.get("trip_date"),
                    "score": data.get("score")
                })
        
        if not scores:
            return 0.0, 0, []
        
        history.sort(key=lambda x: x["date"], reverse=True)
        return round(sum(scores) / len(scores), 2), len(scores), history[:10]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get rolling average: {str(e)}")


# ============ Trip Scoring Endpoints ============

@app.post("/score-trip", response_model=TripScoreResponse, tags=["Risk Scoring"])
async def score_single_trip(trip: TripInput):
    """
    Process and score a single trip using mock XGBoost behavior.
    
    Scoring penalties:
    - Harsh brakes: 2 points per incident
    - Speeding: 3 points per incident
    - Night driving: 1.5 points per hour
    - Phone usage: 4 points per minute
    - Speed variance: 0.5 points per variance unit
    
    Stores the daily score in Firestore and returns the rolling 30-day average.
    Requires Firestore to be configured.
    """
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Firestore not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable."
        )
    
    trip_date = get_trip_date(trip)
    daily_score, breakdown = calculate_trip_score(trip)
    
    await store_trip_score(trip.driver_id, trip_date, daily_score, breakdown)
    
    rolling_avg, trips_count, _ = await get_rolling_average(trip.driver_id, require_db=True)
    
    if trips_count == 0:
        rolling_avg = daily_score
        trips_count = 1
    
    return TripScoreResponse(
        driver_id=trip.driver_id,
        trip_date=trip_date,
        daily_score=daily_score,
        rolling_avg=rolling_avg,
        breakdown=breakdown,
        trips_in_period=trips_count
    )


@app.get("/driver-score/{driver_id}", response_model=DriverScoreResponse, tags=["Risk Scoring"])
async def get_driver_score(driver_id: str):
    """
    Retrieve the current score and 30-day rolling average for a driver.
    
    Returns the most recent daily score, rolling average, and score history.
    Requires Firestore to be configured.
    """
    rolling_avg, trips_count, history = await get_rolling_average(driver_id, require_db=True)
    
    if trips_count == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No trip scores found for driver {driver_id}"
        )
    
    current_score = history[0]["score"] if history else rolling_avg
    last_trip_date = history[0]["date"] if history else None
    
    return DriverScoreResponse(
        driver_id=driver_id,
        current_score=current_score,
        rolling_avg=rolling_avg,
        trips_in_period=trips_count,
        last_trip_date=last_trip_date,
        score_history=history
    )


@app.post("/batch-score", response_model=BatchTripScoreResponse, tags=["Risk Scoring"])
async def batch_score_trips(request: BatchTripInput):
    """
    Process and score multiple trips in batch.
    
    Each trip is scored individually and stored in Firestore.
    Returns individual results for each trip plus any errors encountered.
    Requires Firestore to be configured.
    """
    if not request.trips:
        raise HTTPException(status_code=400, detail="At least one trip is required")
    
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Firestore not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable."
        )
    
    results = []
    errors = []
    
    for i, trip in enumerate(request.trips):
        try:
            trip_date = get_trip_date(trip)
            daily_score, breakdown = calculate_trip_score(trip)
            
            await store_trip_score(trip.driver_id, trip_date, daily_score, breakdown)
            
            rolling_avg, trips_count, _ = await get_rolling_average(trip.driver_id, require_db=True)
            
            if trips_count == 0:
                rolling_avg = daily_score
                trips_count = 1
            
            results.append(TripScoreResponse(
                driver_id=trip.driver_id,
                trip_date=trip_date,
                daily_score=daily_score,
                rolling_avg=rolling_avg,
                breakdown=breakdown,
                trips_in_period=trips_count
            ))
        except HTTPException as e:
            errors.append(f"Trip {i} ({trip.driver_id}): {e.detail}")
        except Exception as e:
            errors.append(f"Trip {i} ({trip.driver_id}): {str(e)}")
    
    return BatchTripScoreResponse(
        processed_count=len(results),
        results=results,
        errors=errors
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "5000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
