from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    rank: str  # Police rank
    service_number: str
    state: str
    lga: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None
    role: str = "officer"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    rank: Optional[str] = None
    state: Optional[str] = None
    lga: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: str
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    rank: str
    service_number: str
    state: str
    lga: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None
    role: str
    is_active: str
    last_login: Optional[datetime] = None
    created_at: datetime
    permissions: dict  # User's permissions based on rank
    
    class Config:
        from_attributes = True

# Token schema
class Token(BaseModel):
    access_token: str
    token_type: str

# Submission schemas
class SubmissionBase(BaseModel):
    report_date: datetime
    state: str
    lga_or_address: str
    threat_domain: str
    severity: str
    trend: Optional[str] = None
    source_reliability: Optional[str] = None
    source_credibility: Optional[str] = None
    other_agency: Optional[str] = None
    narrative: str
    attachments: Optional[List[str]] = None

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionResponse(SubmissionBase):
    id: int
    submission_id: str
    submitted_by: int
    created_at: datetime
    attachments: Optional[List[str]] = None
    
    class Config:
        from_attributes = True

# Report schemas
class TopAlert(BaseModel):
    rank: int
    state: str
    threat: str
    high_severity_count: int
    total_reports: int
    recommended_first_action: str
    responsible_unit: str

class IncidentSummary(BaseModel):
    crime_type: str
    count: int
    severity_flag: str

class StateRiskProfile(BaseModel):
    state: str
    dominant_crime: str
    risk_rating: str

class DailySitrepResponse(BaseModel):
    reporting_date: datetime
    total_submissions_24h: int
    red_alerts_count: int
    key_intelligence_highlights: List[str]
    incident_summary: List[IncidentSummary]
    top_5_red_alerts: List[TopAlert]
    state_risk_profiling: List[StateRiskProfile] = Field(default_factory=list)
    aggregation_days: Optional[int] = None

class TrendAnalysis(BaseModel):
    crime_type: str
    week_total: int
    trend_direction: str

class WeeklySitrepResponse(BaseModel):
    week_start: datetime
    week_end: datetime
    total_reports_week: int
    red_alerts_count: int
    weekly_trend_analysis: List[TrendAnalysis]
    state_risk_profiling: List[StateRiskProfile]

class MonthlySitrepResponse(BaseModel):
    month_start: datetime
    month_end: datetime
    total_reports_month: int
    red_alerts_count: int
    monthly_trend_analysis: List[TrendAnalysis]
    state_risk_profiling: List[StateRiskProfile]
    top_threats: List[TopAlert]
    comparative_analysis: dict  # Comparison with previous month

class QuarterlySitrepResponse(BaseModel):
    quarter_start: datetime
    quarter_end: datetime
    quarter_number: int
    total_reports_quarter: int
    red_alerts_count: int
    quarterly_trend_analysis: List[TrendAnalysis]
    state_risk_profiling: List[StateRiskProfile]
    top_threats: List[TopAlert]
    comparative_analysis: dict  # Comparison with previous quarter
    strategic_recommendations: List[str]

class BiAnnualSitrepResponse(BaseModel):
    period_start: datetime
    period_end: datetime
    period_name: str  # "First Half" or "Second Half"
    total_reports_period: int
    red_alerts_count: int
    trend_analysis: List[TrendAnalysis]
    state_risk_profiling: List[StateRiskProfile]
    top_threats: List[TopAlert]
    comparative_analysis: dict
    strategic_recommendations: List[str]
    performance_metrics: dict

class YearlySitrepResponse(BaseModel):
    year_start: datetime
    year_end: datetime
    year: int
    total_reports_year: int
    red_alerts_count: int
    annual_trend_analysis: List[TrendAnalysis]
    state_risk_profiling: List[StateRiskProfile]
    top_threats: List[TopAlert]
    comparative_analysis: dict  # Comparison with previous year
    strategic_recommendations: List[str]
    performance_metrics: dict
    annual_summary: str

class RiskMatrixResponse(BaseModel):
    state: str
    threat: str
    total_reports: int
    high_severity_count: int
    risk_flag: str

# Config schemas
class ReportConfigBase(BaseModel):
    daily_report_date: Optional[datetime] = None
    daily_window_days: Optional[int] = None
    week_start_date: Optional[datetime] = None
    week_end_date: Optional[datetime] = None
    high_severity_threshold: Optional[int] = None
    red_alert_threshold: Optional[int] = None

class ReportConfigUpdate(ReportConfigBase):
    pass

class ReportConfigResponse(ReportConfigBase):
    id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Alert Config schemas
class AlertConfigBase(BaseModel):
    email_enabled: Optional[str] = "true"
    sms_enabled: Optional[str] = "false"
    phone_number: Optional[str] = None
    alert_on_critical: Optional[str] = "true"
    alert_on_high: Optional[str] = "true"
    alert_on_medium: Optional[str] = "false"
    alert_on_low: Optional[str] = "false"
    alert_states: Optional[List[str]] = None
    daily_digest: Optional[str] = "false"
    digest_time: Optional[str] = "08:00"

class AlertConfigUpdate(AlertConfigBase):
    pass

class AlertConfigResponse(AlertConfigBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
