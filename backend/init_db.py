"""
Initialize database with default admin user
Run this script once to create the initial admin account
"""
from database import SessionLocal, engine, Base
from models import User, ReportConfig
from auth import get_password_hash
from datetime import datetime, timedelta

# Create all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Check if admin user exists
    admin = db.query(User).filter(User.username == "admin").first()
    
    if not admin:
        # Create admin user
        admin = User(
            username="admin",
            email="admin@npf.gov.ng",
            hashed_password=get_password_hash("admin123"),  # Change this in production!
            full_name="System Administrator",
            rank="IGP",  # Highest rank
            service_number="NPF-00001",
            state="FCT",  # Admin can access all states
            department="Force Headquarters",
            role="admin",
            is_active="true"
        )
        db.add(admin)
        print("+ Admin user created")
        print("  Username: admin")
        print("  Password: admin123")
        print("  WARNING: Please change the password after first login!")
    else:
        print("+ Admin user already exists")
    
    # Create default config if it doesn't exist
    config = db.query(ReportConfig).first()
    if not config:
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        
        config = ReportConfig(
            daily_report_date=datetime.now(),
            daily_window_days=1,
            week_start_date=datetime.combine(week_start, datetime.min.time()),
            week_end_date=datetime.combine(week_start + timedelta(days=7), datetime.min.time()),
            high_severity_threshold=3,
            red_alert_threshold=5
        )
        db.add(config)
        print("+ Default configuration created")
    else:
        print("+ Configuration already exists")
    
    db.commit()
    print("\n+ Database initialization complete!")
    
except Exception as e:
    db.rollback()
    print(f"ERROR: {e}")
finally:
    db.close()
