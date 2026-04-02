"""Initialize agencies in the database"""
from database import SessionLocal
from models import Agency

db = SessionLocal()

try:
    # Check if agencies already exist
    existing = db.query(Agency).first()
    if existing:
        print("Agencies already initialized")
        db.close()
        exit(0)
    
    agencies_data = [
        {
            "name": "Nigeria Police Force",
            "code": "NPF",
            "contact_email": "info@npf.gov.ng",
            "contact_phone": "+234-XXX-XXXX",
            "is_active": "true"
        },
        {
            "name": "Department of State Services",
            "code": "DSS",
            "contact_email": "info@dss.gov.ng",
            "contact_phone": "+234-XXX-XXXX",
            "is_active": "true"
        },
        {
            "name": "Nigeria Security and Civil Defence Corps",
            "code": "NSCDC",
            "contact_email": "info@nscdc.gov.ng",
            "contact_phone": "+234-XXX-XXXX",
            "is_active": "true"
        },
        {
            "name": "Nigerian Armed Forces",
            "code": "NAF",
            "contact_email": "info@defence.gov.ng",
            "contact_phone": "+234-XXX-XXXX",
            "is_active": "true"
        },
        {
            "name": "National Drug Law Enforcement Agency",
            "code": "NDLEA",
            "contact_email": "info@ndlea.gov.ng",
            "contact_phone": "+234-XXX-XXXX",
            "is_active": "true"
        },
        {
            "name": "National Agency for the Prohibition of Trafficking in Persons",
            "code": "NAPTIP",
            "contact_email": "info@naptip.gov.ng",
            "contact_phone": "+234-XXX-XXXX",
            "is_active": "true"
        },
        {
            "name": "Economic and Financial Crimes Commission",
            "code": "EFCC",
            "contact_email": "info@efcc.gov.ng",
            "contact_phone": "+234-XXX-XXXX",
            "is_active": "true"
        },
        {
            "name": "Independent Corrupt Practices and Other Related Offences Commission",
            "code": "ICPC",
            "contact_email": "info@icpc.gov.ng",
            "contact_phone": "+234-XXX-XXXX",
            "is_active": "true"
        }
    ]
    
    for agency_data in agencies_data:
        agency = Agency(**agency_data)
        db.add(agency)
        print(f"+ Created agency: {agency_data['name']} ({agency_data['code']})")
    
    db.commit()
    print(f"\n+ Successfully initialized {len(agencies_data)} agencies!")
    
except Exception as e:
    db.rollback()
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
