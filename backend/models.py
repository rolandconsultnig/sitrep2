from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

# Nigeria States + FCT
NIGERIA_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
    "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
    "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
    "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
    "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
]

THREAT_TYPES = [
    "Kidnapping", "Armed Robbery", "Banditry", "Terrorism", "Cultism",
    "Rape / Sexual Violence", "Cybercrime", "Homicide", "Drug trafficking",
    "Human trafficking"
]

SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"]
TREND_OPTIONS = ["Increasing", "Stable", "Decreasing"]
RELIABILITY_LEVELS = ["A", "B", "C", "D", "E", "F"]
CREDIBILITY_LEVELS = ["1", "2", "3", "4", "5", "6"]

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STATE_COMMANDER = "state_commander"
    OFFICER = "officer"

class PoliceRank(str, enum.Enum):
    IGP = "IGP"  # Inspector General of Police - Highest authority
    DIG = "DIG"  # Deputy Inspector General
    AIG = "AIG"  # Assistant Inspector General
    CP = "CP"    # Commissioner of Police
    DCP = "DCP"  # Deputy Commissioner of Police
    ACP = "ACP"  # Assistant Commissioner of Police
    CSP = "CSP"  # Chief Superintendent of Police
    SP = "SP"    # Superintendent of Police
    DSP = "DSP"  # Deputy Superintendent of Police
    ASP = "ASP"  # Assistant Superintendent of Police - Entry level

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    rank = Column(String, index=True)  # Police rank (IGP, DIG, AIG, CP, etc.)
    service_number = Column(String, unique=True, index=True)  # Police service number
    state = Column(String, index=True)  # State command assignment
    lga = Column(String)  # Local Government Area
    department = Column(String)  # Department/Unit assignment
    phone_number = Column(String)
    role = Column(String, default=UserRole.OFFICER.value)
    is_active = Column(String, default="true")
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    submissions = relationship("Submission", back_populates="submitter")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(String, unique=True, index=True)
    report_date = Column(DateTime, default=datetime.utcnow, index=True)
    state = Column(String, index=True)
    lga_or_address = Column(String)
    threat_domain = Column(String, index=True)
    severity = Column(String, index=True)
    trend = Column(String)
    source_reliability = Column(String)
    source_credibility = Column(String)
    other_agency = Column(String)
    narrative = Column(Text)
    attachments = Column(Text)  # JSON array of attachment URLs/paths
    submitted_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    submitter = relationship("User", back_populates="submissions")

class ReportConfig(Base):
    __tablename__ = "report_config"
    
    id = Column(Integer, primary_key=True, index=True)
    daily_report_date = Column(DateTime, default=datetime.utcnow)
    daily_window_days = Column(Integer, default=1)
    week_start_date = Column(DateTime)
    week_end_date = Column(DateTime)
    high_severity_threshold = Column(Integer, default=3)  # High severity count threshold
    red_alert_threshold = Column(Integer, default=5)  # Total reports for RED alert
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    username = Column(String, index=True)
    action = Column(String, index=True)  # CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT
    resource_type = Column(String)  # SUBMISSION, USER, REPORT, CONFIG
    resource_id = Column(Integer)
    ip_address = Column(String)
    user_agent = Column(String)
    details = Column(Text)  # JSON string with additional details
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User")

class Agency(Base):
    __tablename__ = "agencies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # NPF, DSS, NSCDC, Military, etc.
    code = Column(String, unique=True)  # Agency code
    contact_email = Column(String)
    contact_phone = Column(String)
    is_active = Column(String, default="true")
    created_at = Column(DateTime, default=datetime.utcnow)

class Collaboration(Base):
    __tablename__ = "collaborations"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), index=True)
    agency_id = Column(Integer, ForeignKey("agencies.id"), index=True)
    shared_by = Column(Integer, ForeignKey("users.id"))
    shared_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending, accepted, declined
    notes = Column(Text)
    
    submission = relationship("Submission")
    agency = relationship("Agency")
    sharer = relationship("User")

class PredictionModel(Base):
    __tablename__ = "prediction_models"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, unique=True)
    model_type = Column(String)  # hotspot, trend, anomaly
    version = Column(String)
    accuracy_score = Column(String)  # JSON string
    trained_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(String, default="true")
    model_path = Column(String)  # Path to saved model file

class AlertConfig(Base):
    __tablename__ = "alert_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    email_enabled = Column(String, default="true")
    sms_enabled = Column(String, default="false")
    phone_number = Column(String)
    alert_on_critical = Column(String, default="true")
    alert_on_high = Column(String, default="true")
    alert_on_medium = Column(String, default="false")
    alert_on_low = Column(String, default="false")
    alert_states = Column(Text)  # JSON array of states to monitor
    daily_digest = Column(String, default="false")
    digest_time = Column(String, default="08:00")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User")
