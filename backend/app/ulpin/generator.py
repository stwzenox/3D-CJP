import re
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.config import settings
from app.models.entities import Property

class UlpinGenerator:
    """
    3D ULPIN (Unique Land Parcel Identification Number) Generator.
    Format for Demonstration / Prototype:
    {COUNTRY}-{STATE}-{PREFIX}-{BUILDING_ID}-{FLOOR_ID}-{PROPERTY_ID}
    Example: IN-UP-DEMO-B001-F03-P001
    """

    def __init__(self, country: str = None, state: str = None, prefix: str = None):
        self.country = country or settings.COUNTRY_CODE
        self.state = state or settings.STATE_CODE
        self.prefix = prefix or settings.DEMO_PREFIX

    def format_ulpin(self, building_id: str, floor_id: str, property_id: str) -> str:
        # Clean inputs to alphanumeric / dashes
        b_clean = re.sub(r'[^A-Za-z0-9]', '', building_id).upper()
        f_clean = re.sub(r'[^A-Za-z0-9]', '', floor_id).upper()
        p_clean = re.sub(r'[^A-Za-z0-9]', '', property_id).upper()
        
        return f"{self.country}-{self.state}-{self.prefix}-{b_clean}-{f_clean}-{p_clean}"

    def check_uniqueness(self, db: Session, ulpin: str) -> bool:
        """
        Returns True if ULPIN is unique (not already in database).
        """
        existing = db.query(Property).filter(Property.ulpin == ulpin).first()
        return existing is None

    def generate_and_verify(
        self,
        db: Session,
        building_id: str,
        floor_id: str,
        property_id: str
    ) -> Tuple[str, bool, str]:
        """
        Generates ULPIN and validates uniqueness in the cadastral database.
        Returns: (ulpin_str, is_unique, message)
        """
        candidate_ulpin = self.format_ulpin(building_id, floor_id, property_id)
        is_unique = self.check_uniqueness(db, candidate_ulpin)
        
        if not is_unique:
            return candidate_ulpin, False, f"ULPIN {candidate_ulpin} already registered in database."
            
        return candidate_ulpin, True, f"Generated unique 3D ULPIN: {candidate_ulpin}"

ulpin_generator = UlpinGenerator()
