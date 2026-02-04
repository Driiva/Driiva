"""
Driiva Refund Calculator API
FastAPI application for calculating driver refunds based on driving scores and pool safety.
"""

import os
from typing import List, Optional
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

# Firestore client (will be initialized if credentials are available)
db = None

def init_firestore():
    """Initialize Firestore client if credentials are available."""
    global db
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
                # Try default credentials (for Replit with secrets)
                firebase_admin.initialize_app()
        
        db = firestore.client()
        print("Firestore initialized successfully")
    except Exception as e:
        print(f"Firestore not initialized: {e}")
        db = None

# Try to initialize Firestore on startup
init_firestore()


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
        "firestore_connected": db is not None
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
