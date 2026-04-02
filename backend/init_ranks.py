"""Update existing users with ranks and create sample users for each rank"""
from database import SessionLocal
from models import User
from auth import get_password_hash

db = SessionLocal()

try:
    # Update admin user with IGP rank
    admin = db.query(User).filter(User.username == "admin").first()
    if admin:
        if not admin.rank:
            admin.rank = "IGP"
            admin.service_number = "NPF-00001"
            admin.department = "Force Headquarters"
            print("+ Updated admin user with IGP rank")
        db.commit()
    
    # Create sample users for each rank (if they don't exist)
    sample_users = [
        {
            "username": "dig_sample",
            "email": "dig@npf.gov.ng",
            "password": "password123",
            "full_name": "Deputy Inspector General Sample",
            "rank": "DIG",
            "service_number": "NPF-00002",
            "state": "FCT",
            "department": "Operations",
            "role": "state_commander"
        },
        {
            "username": "aig_sample",
            "email": "aig@npf.gov.ng",
            "password": "password123",
            "full_name": "Assistant Inspector General Sample",
            "rank": "AIG",
            "service_number": "NPF-00003",
            "state": "Lagos",
            "department": "Zone A",
            "role": "state_commander"
        },
        {
            "username": "cp_lagos",
            "email": "cp@lagos.npf.gov.ng",
            "password": "password123",
            "full_name": "Commissioner of Police Lagos",
            "rank": "CP",
            "service_number": "NPF-00004",
            "state": "Lagos",
            "department": "Lagos State Command",
            "role": "state_commander"
        },
        {
            "username": "dcp_sample",
            "email": "dcp@lagos.npf.gov.ng",
            "password": "password123",
            "full_name": "Deputy Commissioner Sample",
            "rank": "DCP",
            "service_number": "NPF-00005",
            "state": "Lagos",
            "department": "Operations",
            "role": "officer"
        },
        {
            "username": "asp_field",
            "email": "asp@lagos.npf.gov.ng",
            "password": "password123",
            "full_name": "Assistant Superintendent Field Officer",
            "rank": "ASP",
            "service_number": "NPF-00006",
            "state": "Lagos",
            "department": "Area Command",
            "role": "officer"
        }
    ]
    
    created = 0
    for user_data in sample_users:
        existing = db.query(User).filter(
            (User.username == user_data["username"]) | 
            (User.service_number == user_data["service_number"])
        ).first()
        
        if not existing:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                rank=user_data["rank"],
                service_number=user_data["service_number"],
                state=user_data["state"],
                department=user_data["department"],
                role=user_data["role"]
            )
            db.add(user)
            created += 1
            print(f"+ Created {user_data['rank']}: {user_data['username']}")
    
    db.commit()
    print(f"\n+ Created {created} sample users")
    print("+ Rank-based user system initialized!")
    
except Exception as e:
    db.rollback()
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
