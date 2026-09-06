from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

# Parcel Schemas
class ParcelBase(BaseModel):
    parcel_id: str
    geometry: Dict[str, Any]
    area: float
    land_use: str = "Residential"
    survey_number: str
    status: str = "Active"

class ParcelCreate(ParcelBase):
    pass

class ParcelResponse(ParcelBase):
    id: int
    class Config:
        from_attributes = True

# Building Schemas
class BuildingBase(BaseModel):
    building_id: str
    parcel_id: str
    geometry: Dict[str, Any]
    ground_elevation: float
    roof_elevation: float
    height: float
    floor_count: int
    building_type: str = "Residential"

class BuildingCreate(BuildingBase):
    pass

class BuildingResponse(BuildingBase):
    id: int
    class Config:
        from_attributes = True

# Floor Schemas
class FloorBase(BaseModel):
    floor_id: str
    building_id: str
    floor_number: int
    z_min: float
    z_max: float
    area: float
    geometry: Dict[str, Any]

class FloorCreate(FloorBase):
    pass

class FloorResponse(FloorBase):
    id: int
    class Config:
        from_attributes = True

# Vertical Parcel Schemas
class VerticalParcelBase(BaseModel):
    vertical_parcel_id: str
    parcel_id: str
    building_id: str
    floor_id: str
    geometry: Dict[str, Any]
    z_min: float
    z_max: float
    area: float
    volume: float
    property_type: str = "Apartment"

class VerticalParcelCreate(VerticalParcelBase):
    pass

class VerticalParcelResponse(VerticalParcelBase):
    id: int
    class Config:
        from_attributes = True

# Property Schemas
class PropertyBase(BaseModel):
    property_id: str
    ulpin: str
    vertical_parcel_id: str
    owner_name: str
    property_type: str = "Residential Unit"
    status: str = "Registered"
    verification_status: str = "Verified Demo Data"

class PropertyCreate(PropertyBase):
    pass

class PropertyResponse(PropertyBase):
    id: int
    class Config:
        from_attributes = True

# Underground Asset Schemas
class UndergroundAssetBase(BaseModel):
    asset_id: str
    asset_type: str
    geometry: Dict[str, Any]
    z_min: float
    z_max: float
    owner: str = "Municipal Utility"
    status: str = "Active"

class UndergroundAssetCreate(UndergroundAssetBase):
    pass

class UndergroundAssetResponse(UndergroundAssetBase):
    id: int
    class Config:
        from_attributes = True

# GNSS Station Schemas
class GnssStationBase(BaseModel):
    station_id: str
    latitude: float
    longitude: float
    elevation: float
    accuracy: float = 0.03

class GnssStationCreate(GnssStationBase):
    pass

class GnssStationResponse(GnssStationBase):
    id: int
    class Config:
        from_attributes = True

# Validation Schemas
class ValidationResultResponse(BaseModel):
    id: int
    object_id: str
    object_type: str
    validation_type: str
    severity: str
    message: str
    status: str
    class Config:
        from_attributes = True

# ULPIN Generation
class UlpinGenerateRequest(BaseModel):
    building_id: str
    floor_id: str
    property_id: str
    owner_name: Optional[str] = "Govt Allocated Citizen"
    property_type: Optional[str] = "Residential Unit"

class UlpinGenerateResponse(BaseModel):
    ulpin: str
    property_id: str
    vertical_parcel_id: str
    message: str
    created: bool

# Dashboard Summary
class DashboardMetrics(BaseModel):
    total_parcels: int
    total_buildings: int
    total_floors: int
    total_vertical_properties: int
    total_ulpins: int
    underground_assets: int
    validation_errors: int
    validation_warnings: int
