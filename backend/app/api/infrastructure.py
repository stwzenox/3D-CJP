from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.session import get_db
from app.models.entities import (
    UndergroundAsset, GnssStation, Parcel, Building, Floor,
    VerticalParcel, Property, ValidationResult
)
from app.schemas.pydantic_models import (
    UndergroundAssetResponse, GnssStationResponse, DashboardMetrics
)
from app.geospatial.terrain import terrain_service
from app.services.lidar_service import lidar_service

router = APIRouter(tags=["Infrastructure & Analytics"])

@router.get("/underground-assets", response_model=List[UndergroundAssetResponse])
def get_underground_assets(db: Session = Depends(get_db)):
    return db.query(UndergroundAsset).all()

@router.get("/gnss", response_model=List[GnssStationResponse])
def get_gnss_stations(db: Session = Depends(get_db)):
    return db.query(GnssStation).all()

@router.get("/terrain")
def get_terrain_data():
    return terrain_service.get_grid_data()

@router.get("/lidar")
def get_lidar_points():
    return lidar_service.generate_synthetic_point_cloud()

@router.post("/lidar/estimate-height")
def estimate_building_height(payload: Dict[str, Any] = Body(...)):
    cx = float(payload.get("center_x", 0.0))
    cz = float(payload.get("center_z", 0.0))
    radius = float(payload.get("radius", 25.0))
    return lidar_service.calculate_building_height_from_points(cx, cz, radius)

@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_parcels = db.query(Parcel).count()
    total_buildings = db.query(Building).count()
    total_floors = db.query(Floor).count()
    total_vertical = db.query(VerticalParcel).count()
    total_ulpins = db.query(Property).count()
    underground = db.query(UndergroundAsset).count()
    
    val_errors = db.query(ValidationResult).filter(ValidationResult.severity == "ERROR").count()
    val_warnings = db.query(ValidationResult).filter(ValidationResult.severity == "WARNING").count()

    return DashboardMetrics(
        total_parcels=total_parcels,
        total_buildings=total_buildings,
        total_floors=total_floors,
        total_vertical_properties=total_vertical,
        total_ulpins=total_ulpins,
        underground_assets=underground,
        validation_errors=val_errors,
        validation_warnings=val_warnings
    )
