import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ulpin.generator import ulpin_generator
from app.geospatial.projection import geographic_to_local, local_to_geographic
from app.database.session import SessionLocal
from app.validation.topology_checker import topology_validator

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "reference_origin" in data

def test_parcels_endpoint():
    response = client.get("/api/parcels")
    assert response.status_code == 200
    parcels = response.json()
    assert len(parcels) == 15
    assert any(p["parcel_id"] == "P001" for p in parcels)

def test_buildings_endpoint():
    response = client.get("/api/buildings")
    assert response.status_code == 200
    buildings = response.json()
    assert len(buildings) >= 8
    b1 = next(b for b in buildings if b["building_id"] == "B001")
    assert b1["floor_count"] == 6
    assert b1["height"] == 18.0

def test_apartment_subdivision():
    # B001 Floor 3 has 3 apartments: APT-A, APT-B, APT-C
    response = client.get("/api/vertical-properties?building_id=B001&floor_id=B001-F03")
    assert response.status_code == 200
    apartments = response.json()
    assert len(apartments) == 3
    sub_ids = [a["vertical_parcel_id"] for a in apartments]
    assert "B001-F03-APT-A" in sub_ids
    assert "B001-F03-APT-B" in sub_ids
    assert "B001-F03-APT-C" in sub_ids

def test_coordinate_conversion_roundtrip():
    lat, lng, elev = 25.4358, 81.8463, 105.0
    x, y, z = geographic_to_local(lat, lng, elev)
    # At origin, x and z should be approx 0
    assert abs(x) < 0.1
    assert abs(z) < 0.1
    assert abs(y - 105.0) < 0.01

    rev_lat, rev_lng, rev_elev = local_to_geographic(x, y, z)
    assert abs(rev_lat - lat) < 0.0001
    assert abs(rev_lng - lng) < 0.0001

def test_ulpin_format():
    code = ulpin_generator.format_ulpin("B001", "F03", "APT-A")
    assert code == "UP2110B0103A01"
    assert len(code) == 14
    assert code.isalnum()
    assert ulpin_generator.is_valid_14_digit_ulpin(code)

def test_topology_validation():
    db = SessionLocal()
    results = topology_validator.run_all_validations(db)
    db.close()
    assert len(results) > 0
    assert any(r["severity"] in ["VALID", "WARNING", "ERROR"] for r in results)

def test_dashboard_metrics():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    metrics = response.json()
    assert metrics["total_parcels"] == 15
    assert metrics["total_buildings"] >= 8
    assert metrics["total_floors"] >= 40
    assert metrics["underground_assets"] >= 2
