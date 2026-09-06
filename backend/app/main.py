from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.parcels import router as parcels_router
from app.api.buildings import router as buildings_router
from app.api.floors import router as floors_router
from app.api.properties import router as properties_router
from app.api.ulpin import router as ulpin_router
from app.api.validation import router as validation_router
from app.api.infrastructure import router as infra_router
from app.api.imports import router as imports_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for 3D ULPIN & Vertical Property Mapping System (SIH 2026 Problem Statement 11 Prototype)"
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(parcels_router, prefix=settings.API_V1_STR)
app.include_router(buildings_router, prefix=settings.API_V1_STR)
app.include_router(floors_router, prefix=settings.API_V1_STR)
app.include_router(properties_router, prefix=settings.API_V1_STR)
app.include_router(ulpin_router, prefix=settings.API_V1_STR)
app.include_router(validation_router, prefix=settings.API_V1_STR)
app.include_router(infra_router, prefix=settings.API_V1_STR)
app.include_router(imports_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    from app.database.session import SessionLocal, Base, engine
    from app.models.entities import Parcel
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Parcel).count() == 0:
            from seed.generate_demo_data import generate_all_demo_data
            generate_all_demo_data()
    except Exception as e:
        print(f"Auto-initializing database tables: {e}")
        from seed.generate_demo_data import generate_all_demo_data
        generate_all_demo_data()
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "Operational",
        "reference_origin": {
            "latitude": settings.ORIGIN_LAT,
            "longitude": settings.ORIGIN_LNG,
            "elevation_m": settings.ORIGIN_ELEVATION,
            "location": "Prayagraj, Uttar Pradesh, India"
        },
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
