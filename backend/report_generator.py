from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from models import Submission, ReportConfig, User
from schemas import (
    DailySitrepResponse, WeeklySitrepResponse, RiskMatrixResponse,
    MonthlySitrepResponse, QuarterlySitrepResponse, BiAnnualSitrepResponse,
    YearlySitrepResponse,
    TopAlert, IncidentSummary, TrendAnalysis, StateRiskProfile
)

# Action Library mapping
ACTION_LIBRARY = {
    "Kidnapping": {
        "action": "Activate anti-kidnapping response; deploy surveillance teams; coordinate with family liaison",
        "unit": "State CID / Anti-Kidnapping Unit"
    },
    "Armed Robbery": {
        "action": "Increase stop-and-search and targeted patrols on identified routes; deploy tactical teams",
        "unit": "Area Command / Tactical Teams"
    },
    "Banditry": {
        "action": "Escalate to joint task coordination; strengthen rural patrols; coordinate with military",
        "unit": "Operations / Joint Task Coordination"
    },
    "Terrorism": {
        "action": "Immediate escalation to CT units; coordinate with DSS and military intelligence",
        "unit": "CT Unit / Intelligence HQ"
    },
    "Cultism": {
        "action": "Hotspot policing; engage community informants; monitor known cult hideouts",
        "unit": "State Intelligence / Area Command"
    },
    "Rape / Sexual Violence": {
        "action": "Prioritize victim protection and evidence preservation; activate gender desk protocols",
        "unit": "Gender Desk / SCID"
    },
    "Cybercrime": {
        "action": "Preserve digital evidence; refer to cyber unit; monitor online platforms",
        "unit": "Cybercrime Unit"
    },
    "Homicide": {
        "action": "Secure scene; deploy detectives; canvass witnesses; preserve evidence",
        "unit": "SCID / Homicide Desk"
    },
    "Drug trafficking": {
        "action": "Targeted interdiction; coordinate with NDLEA; monitor transit routes",
        "unit": "NPF Narcotics Unit / NDLEA Liaison"
    },
    "Human trafficking": {
        "action": "Immediate safeguarding; coordinate with NAPTIP; secure victims and evidence",
        "unit": "Anti-Trafficking Desk / NAPTIP Liaison"
    }
}

def get_config(db: Session) -> ReportConfig:
    config = db.query(ReportConfig).first()
    if not config:
        config = ReportConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

def get_submissions_query(db: Session, user: User, start_date: datetime = None, end_date: datetime = None):
    query = db.query(Submission)
    
    # Filter by state if user is not admin
    if user.role != "admin":
        query = query.filter(Submission.state == user.state)
    
    if start_date:
        query = query.filter(Submission.report_date >= start_date)
    if end_date:
        query = query.filter(Submission.report_date < end_date)
    
    return query

def generate_daily_sitrep(
    db: Session,
    report_date: datetime,
    user: User,
    *,
    lookback_days: Optional[int] = None,
) -> DailySitrepResponse:
    config = get_config(db)

    aggregation_days: Optional[int] = None
    if lookback_days is not None and lookback_days > 0:
        # Rolling window ending tomorrow 00:00 — includes all of "today" and prior (lookback_days) calendar days from start anchor
        now = datetime.now()
        end_date = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = (now - timedelta(days=lookback_days)).replace(hour=0, minute=0, second=0, microsecond=0)
        aggregation_days = lookback_days
    else:
        if isinstance(report_date, datetime):
            start_date = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            start_date = datetime.combine(report_date, datetime.min.time())
        end_date = start_date + timedelta(days=config.daily_window_days)
    
    # Get submissions for the day
    submissions = get_submissions_query(db, user, start_date, end_date).all()
    
    total_submissions = len(submissions)
    
    # Count by threat domain and severity
    threat_counts = {}
    high_severity_threats = {}
    
    for sub in submissions:
        threat = sub.threat_domain
        if threat not in threat_counts:
            threat_counts[threat] = 0
            high_severity_threats[threat] = 0
        
        threat_counts[threat] += 1
        if sub.severity in ["High", "Critical"]:
            high_severity_threats[threat] += 1
    
    # Generate incident summary
    incident_summary = []
    for threat, count in threat_counts.items():
        severity_flag = "RED" if high_severity_threats[threat] >= config.high_severity_threshold else "AMBER" if count >= config.red_alert_threshold else "GREEN"
        incident_summary.append(IncidentSummary(
            crime_type=threat,
            count=count,
            severity_flag=severity_flag
        ))
    
    # Count RED alerts
    red_alerts = sum(1 for item in incident_summary if item.severity_flag == "RED")
    
    # Generate top 5 RED alerts
    red_alert_items = []
    for threat, count in threat_counts.items():
        high_sev_count = high_severity_threats[threat]
        if high_sev_count >= config.high_severity_threshold or count >= config.red_alert_threshold:
            # Get state with most reports for this threat
            state_submissions = db.query(
                Submission.state,
                func.count(Submission.id).label('count')
            ).filter(
                and_(
                    Submission.threat_domain == threat,
                    Submission.report_date >= start_date,
                    Submission.report_date < end_date
                )
            )
            
            if user.role != "admin":
                state_submissions = state_submissions.filter(Submission.state == user.state)
            
            top_state = state_submissions.group_by(Submission.state).order_by(func.count(Submission.id).desc()).first()
            
            state = top_state[0] if top_state else user.state
            action_info = ACTION_LIBRARY.get(threat, {"action": "Review and assess", "unit": "Area Command"})
            
            red_alert_items.append({
                "threat": threat,
                "state": state,
                "count": count,
                "high_sev_count": high_sev_count,
                "action": action_info["action"],
                "unit": action_info["unit"]
            })
    
    # Sort by high severity count, then total count
    red_alert_items.sort(key=lambda x: (x["high_sev_count"], x["count"]), reverse=True)
    
    top_5_alerts = []
    for idx, item in enumerate(red_alert_items[:5], 1):
        top_5_alerts.append(TopAlert(
            rank=idx,
            state=item["state"],
            threat=item["threat"],
            high_severity_count=item["high_sev_count"],
            total_reports=item["count"],
            recommended_first_action=item["action"],
            responsible_unit=item["unit"]
        ))
    
    # Generate key intelligence highlights
    highlights = []
    if top_5_alerts:
        highlights.append(f"{len(top_5_alerts)} critical threats identified requiring immediate attention")
    if red_alerts > 0:
        highlights.append(f"{red_alerts} RED alert(s) flagged for priority response")
    if total_submissions > 0:
        if aggregation_days is not None:
            highlights.append(
                f"Total of {total_submissions} incident reports in the last {aggregation_days} days (dashboard window)"
            )
        else:
            highlights.append(f"Total of {total_submissions} incident reports received in 24-hour period")

    if not highlights:
        if aggregation_days is not None:
            highlights.append("No critical incidents reported in the selected dashboard period")
        else:
            highlights.append("No critical incidents reported in the last 24 hours")

    state_risk_profiling: List[StateRiskProfile] = []
    if aggregation_days is not None:
        from report_generator_extended import get_state_risk_profiling

        state_risk_profiling = get_state_risk_profiling(db, user, start_date, end_date)

    return DailySitrepResponse(
        reporting_date=start_date,
        total_submissions_24h=total_submissions,
        red_alerts_count=red_alerts,
        key_intelligence_highlights=highlights,
        incident_summary=incident_summary,
        top_5_red_alerts=top_5_alerts,
        state_risk_profiling=state_risk_profiling,
        aggregation_days=aggregation_days,
    )

def generate_weekly_sitrep(db: Session, week_start: datetime, user: User) -> WeeklySitrepResponse:
    config = get_config(db)
    
    if isinstance(week_start, datetime):
        start_date = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = datetime.combine(week_start, datetime.min.time())
    
    end_date = start_date + timedelta(days=7)
    
    # Get submissions for the week
    submissions = get_submissions_query(db, user, start_date, end_date).all()
    
    total_reports = len(submissions)
    
    # Count by threat domain
    threat_counts = {}
    for sub in submissions:
        threat = sub.threat_domain
        threat_counts[threat] = threat_counts.get(threat, 0) + 1
    
    # Get previous week for trend comparison
    prev_week_start = start_date - timedelta(days=7)
    prev_week_end = start_date
    
    prev_submissions = get_submissions_query(db, user, prev_week_start, prev_week_end).all()
    prev_threat_counts = {}
    for sub in prev_submissions:
        threat = sub.threat_domain
        prev_threat_counts[threat] = prev_threat_counts.get(threat, 0) + 1
    
    # Generate trend analysis
    trend_analysis = []
    all_threats = set(list(threat_counts.keys()) + list(prev_threat_counts.keys()))
    
    for threat in all_threats:
        current = threat_counts.get(threat, 0)
        previous = prev_threat_counts.get(threat, 0)
        
        if current > previous:
            trend = "Increasing"
        elif current < previous:
            trend = "Decreasing"
        else:
            trend = "Stable"
        
        trend_analysis.append(TrendAnalysis(
            crime_type=threat,
            week_total=current,
            trend_direction=trend
        ))
    
    # State risk profiling
    state_risk_profiles = []
    
    # Get state-level statistics
    state_query = db.query(
        Submission.state,
        Submission.threat_domain,
        func.count(Submission.id).label('count')
    ).filter(
        and_(
            Submission.report_date >= start_date,
            Submission.report_date < end_date
        )
    )
    
    if user.role != "admin":
        state_query = state_query.filter(Submission.state == user.state)
    
    state_stats = state_query.group_by(Submission.state, Submission.threat_domain).all()
    
    # Group by state
    state_threats = {}
    for state, threat, count in state_stats:
        if state not in state_threats:
            state_threats[state] = {}
        state_threats[state][threat] = count
    
    # Calculate risk rating for each state
    for state, threats in state_threats.items():
        total = sum(threats.values())
        high_sev_count = sum(
            count for threat, count in threats.items()
            if threat in ACTION_LIBRARY  # All tracked threats are considered significant
        )
        
        # Determine dominant crime
        dominant_crime = max(threats.items(), key=lambda x: x[1])[0] if threats else "None"
        
        # Risk rating logic
        if total >= 20 or high_sev_count >= 10:
            risk_rating = "HIGH"
        elif total >= 10 or high_sev_count >= 5:
            risk_rating = "MEDIUM"
        else:
            risk_rating = "LOW"
        
        state_risk_profiles.append(StateRiskProfile(
            state=state,
            dominant_crime=dominant_crime,
            risk_rating=risk_rating
        ))
    
    # Count RED alerts (same logic as daily)
    red_alerts = sum(
        1 for threat, count in threat_counts.items()
        if count >= config.red_alert_threshold
    )
    
    return WeeklySitrepResponse(
        week_start=start_date,
        week_end=end_date,
        total_reports_week=total_reports,
        red_alerts_count=red_alerts,
        weekly_trend_analysis=trend_analysis,
        state_risk_profiling=state_risk_profiles
    )

def generate_daily_risk_matrix(db: Session, report_date: datetime, user: User) -> List[RiskMatrixResponse]:
    config = get_config(db)
    
    if isinstance(report_date, datetime):
        start_date = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = datetime.combine(report_date, datetime.min.time())
    
    end_date = start_date + timedelta(days=config.daily_window_days)
    
    # Query for state-threat combinations
    query = db.query(
        Submission.state,
        Submission.threat_domain,
        func.count(Submission.id).label('total_reports'),
        func.sum(func.case((Submission.severity.in_(["High", "Critical"]), 1), else_=0)).label('high_severity_count')
    ).filter(
        and_(
            Submission.report_date >= start_date,
            Submission.report_date < end_date
        )
    )
    
    if user.role != "admin":
        query = query.filter(Submission.state == user.state)
    
    results = query.group_by(Submission.state, Submission.threat_domain).all()
    
    risk_matrix = []
    for state, threat, total, high_sev in results:
        high_sev_count = int(high_sev) if high_sev else 0
        
        # Determine risk flag
        if high_sev_count >= config.high_severity_threshold or total >= config.red_alert_threshold:
            risk_flag = "RED"
        elif high_sev_count >= 1 or total >= 3:
            risk_flag = "AMBER"
        else:
            risk_flag = "GREEN"
        
        risk_matrix.append(RiskMatrixResponse(
            state=state,
            threat=threat,
            total_reports=int(total),
            high_severity_count=high_sev_count,
            risk_flag=risk_flag
        ))
    
    return risk_matrix

def generate_weekly_risk_matrix(db: Session, week_start: datetime, user: User) -> List[RiskMatrixResponse]:
    config = get_config(db)
    
    if isinstance(week_start, datetime):
        start_date = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = datetime.combine(week_start, datetime.min.time())
    
    end_date = start_date + timedelta(days=7)
    
    # Query for state-threat combinations (weekly)
    query = db.query(
        Submission.state,
        Submission.threat_domain,
        func.count(Submission.id).label('total_reports'),
        func.sum(func.case((Submission.severity.in_(["High", "Critical"]), 1), else_=0)).label('high_severity_count')
    ).filter(
        and_(
            Submission.report_date >= start_date,
            Submission.report_date < end_date
        )
    )
    
    if user.role != "admin":
        query = query.filter(Submission.state == user.state)
    
    results = query.group_by(Submission.state, Submission.threat_domain).all()
    
    risk_matrix = []
    for state, threat, total, high_sev in results:
        high_sev_count = int(high_sev) if high_sev else 0
        
        # Weekly thresholds (higher than daily)
        weekly_red_threshold = config.red_alert_threshold * 3
        weekly_high_sev_threshold = config.high_severity_threshold * 2
        
        if high_sev_count >= weekly_high_sev_threshold or total >= weekly_red_threshold:
            risk_flag = "RED"
        elif high_sev_count >= config.high_severity_threshold or total >= config.red_alert_threshold:
            risk_flag = "AMBER"
        else:
            risk_flag = "GREEN"
        
        risk_matrix.append(RiskMatrixResponse(
            state=state,
            threat=threat,
            total_reports=int(total),
            high_severity_count=high_sev_count,
            risk_flag=risk_flag
        ))
    
    return risk_matrix
