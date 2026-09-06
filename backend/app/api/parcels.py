from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.entities import Parcel
from app.schemas.pydantic_models import ParcelResponse

router = APIRouter(prefix="/parcels", tags=["Parcels"])

@router.get("", response_model=List[ParcelResponse])
def get_all_parcels(db: Session = Depends(get_db)):
    return db.query(Parcel).all()

@router.get("/{parcel_id}", response_model=ParcelResponse)
def get_parcel(parcel_id: str, db: Session = Depends(get_db)):
    parcel = db.query(Parcel).filter(Parcel.parcel_id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel {parcel_id} not found")
    return parcel
