"""
Create test users for all 36 states + FCT
Run this after initializing the database
"""
from database import SessionLocal
from models import User
from auth import get_password_hash

NIGERIA_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
    "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
    "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
    "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
    "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
]

db = SessionLocal()

try:
    created_count = 0
    existing_count = 0
    
    for state in NIGERIA_STATES:
        username = f"{state.lower().replace(' ', '_')}_commander"
        email = f"commander@{state.lower().replace(' ', '')}.npf.gov.ng"
        
        # Check if user exists
        existing_user = db.query(User).filter(User.username == username).first()
        
        if existing_user:
            print(f"- User already exists: {username}")
            existing_count += 1
            continue
        
        # Create state commander
        user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash("password123"),  # Default password
            full_name=f"{state} State Commander",
            state=state,
            role="state_commander"
        )
        db.add(user)
        created_count += 1
        print(f"+ Created: {username} ({state})")
    
    # Create a test officer for Lagos
    officer_username = "lagos_officer"
    existing_officer = db.query(User).filter(User.username == officer_username).first()
    if not existing_officer:
        officer = User(
            username=officer_username,
            email="officer@lagos.npf.gov.ng",
            hashed_password=get_password_hash("password123"),
            full_name="Lagos State Officer",
            state="Lagos",
            role="officer"
        )
        db.add(officer)
        created_count += 1
        print(f"+ Created: {officer_username} (Lagos)")
    
    db.commit()
    
    print(f"\n{'='*50}")
    print(f"Summary:")
    print(f"  Created: {created_count} users")
    print(f"  Already existed: {existing_count} users")
    print(f"{'='*50}")
    print(f"\nWARNING: All users have default password: password123")
    print(f"   Please change passwords after first login!")
    
except Exception as e:
    db.rollback()
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
