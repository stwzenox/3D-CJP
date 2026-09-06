from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.entities import ValidationResult
from app.schemas.pydantic_models import ValidationResultResponse
from app.validation.topology_checker import topology_validator

router = APIRouter(prefix="/validation", tags=["Topology Validation"])

@router.get("", response_model=List[ValidationResultResponse])
def get_validation_results(db: Session = Depends(get_db)):
    results = db.query(ValidationResult).all()
    if not results:
        # If no results yet, run validator
        return topology_validator.run_all_validations(db)
    return results

@router.post("/run", response_model=List[ValidationResultResponse])
def run_validation(db: Session = Depends(get_db)):
    return topology_validator.run_all_validations(db)
