"""Extended report generator for Monthly, Quarterly, Bi-annual, and Yearly reports"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Dict
from models import Submission, ReportConfig, User
from schemas import (
    MonthlySitrepResponse, QuarterlySitrepResponse, BiAnnualSitrepResponse,
    YearlySitrepResponse, TopAlert, TrendAnalysis, StateRiskProfile
)
# Import from report_generator
from report_generator import ACTION_LIBRARY, get_config, get_submissions_query

def calculate_trends(current_data: Dict[str, int], previous_data: Dict[str, int]) -> List[TrendAnalysis]:
    """Calculate trend analysis comparing current and previous periods"""
    trends = []
    all_threats = set(list(current_data.keys()) + list(previous_data.keys()))
    
    for threat in all_threats:
        current = current_data.get(threat, 0)
        previous = previous_data.get(threat, 0)
        
        if current > previous:
            direction = "Increasing"
        elif current < previous:
            direction = "Decreasing"
        else:
            direction = "Stable"
        
        trends.append(TrendAnalysis(
            crime_type=threat,
            week_total=current,  # Reusing week_total field for all periods
            trend_direction=direction
        ))
    
    return trends

def get_state_risk_profiling(db: Session, user: User, start_date: datetime, end_date: datetime) -> List[StateRiskProfile]:
    """Get state risk profiling for a given period"""
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
    
    state_threats = {}
    for state, threat, count in state_stats:
        if state not in state_threats:
            state_threats[state] = {}
        state_threats[state][threat] = count
    
    profiles = []
    for state, threats in state_threats.items():
        total = sum(threats.values())
        high_sev_count = sum(
            count for threat, count in threats.items()
            if threat in ACTION_LIBRARY
        )
        
        dominant_crime = max(threats.items(), key=lambda x: x[1])[0] if threats else "None"
        
        # Risk rating logic
        if total >= 100 or high_sev_count >= 50:
            risk_rating = "HIGH"
        elif total >= 50 or high_sev_count >= 25:
            risk_rating = "MEDIUM"
        else:
            risk_rating = "LOW"
        
        profiles.append(StateRiskProfile(
            state=state,
            dominant_crime=dominant_crime,
            risk_rating=risk_rating
        ))
    
    return profiles

def get_top_threats(db: Session, user: User, start_date: datetime, end_date: datetime, limit: int = 10) -> List[TopAlert]:
    """Get top threats for a period"""
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
    
    results = query.group_by(Submission.state, Submission.threat_domain).order_by(
        func.count(Submission.id).desc()
    ).limit(limit * 2).all()  # Get more to filter
    
    top_threats = []
    seen_combinations = set()
    
    for state, threat, total, high_sev in results:
        if len(top_threats) >= limit:
            break
        
        key = f"{state}-{threat}"
        if key in seen_combinations:
            continue
        
        seen_combinations.add(key)
        high_sev_count = int(high_sev) if high_sev else 0
        
        action_info = ACTION_LIBRARY.get(threat, {"action": "Review and assess", "unit": "Area Command"})
        
        top_threats.append(TopAlert(
            rank=len(top_threats) + 1,
            state=state,
            threat=threat,
            high_severity_count=high_sev_count,
            total_reports=int(total),
            recommended_first_action=action_info["action"],
            responsible_unit=action_info["unit"]
        ))
    
    return top_threats

def generate_monthly_sitrep(db: Session, month_start: datetime, user: User) -> MonthlySitrepResponse:
    """Generate monthly situation report"""
    config = get_config(db)
    
    if isinstance(month_start, datetime):
        start_date = month_start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = datetime.combine(month_start.replace(day=1), datetime.min.time())
    
    # Calculate end date (first day of next month)
    if start_date.month == 12:
        end_date = start_date.replace(year=start_date.year + 1, month=1)
    else:
        end_date = start_date.replace(month=start_date.month + 1)
    
    # Get submissions for the month
    submissions = get_submissions_query(db, user, start_date, end_date).all()
    total_reports = len(submissions)
    
    # Count by threat domain
    threat_counts = {}
    for sub in submissions:
        threat = sub.threat_domain
        threat_counts[threat] = threat_counts.get(threat, 0) + 1
    
    # Get previous month for comparison
    if start_date.month == 1:
        prev_start = start_date.replace(year=start_date.year - 1, month=12)
    else:
        prev_start = start_date.replace(month=start_date.month - 1)
    prev_end = start_date
    
    prev_submissions = get_submissions_query(db, user, prev_start, prev_end).all()
    prev_threat_counts = {}
    for sub in prev_submissions:
        threat = sub.threat_domain
        prev_threat_counts[threat] = prev_threat_counts.get(threat, 0) + 1
    
    # Generate trend analysis
    trend_analysis = calculate_trends(threat_counts, prev_threat_counts)
    
    # State risk profiling
    state_risk_profiling = get_state_risk_profiling(db, user, start_date, end_date)
    
    # Top threats
    top_threats = get_top_threats(db, user, start_date, end_date, limit=10)
    
    # Count RED alerts
    red_alerts = sum(
        1 for threat, count in threat_counts.items()
        if count >= config.red_alert_threshold * 7  # Monthly threshold
    )
    
    # Comparative analysis
    total_change = total_reports - len(prev_submissions)
    percent_change = (total_change / len(prev_submissions) * 100) if prev_submissions else 0
    
    comparative_analysis = {
        "previous_month_total": len(prev_submissions),
        "current_month_total": total_reports,
        "change": total_change,
        "percent_change": round(percent_change, 2),
        "trend": "Increasing" if total_change > 0 else "Decreasing" if total_change < 0 else "Stable"
    }
    
    return MonthlySitrepResponse(
        month_start=start_date,
        month_end=end_date,
        total_reports_month=total_reports,
        red_alerts_count=red_alerts,
        monthly_trend_analysis=trend_analysis,
        state_risk_profiling=state_risk_profiling,
        top_threats=top_threats,
        comparative_analysis=comparative_analysis
    )

def generate_quarterly_sitrep(db: Session, quarter_start: datetime, user: User) -> QuarterlySitrepResponse:
    """Generate quarterly situation report"""
    config = get_config(db)
    
    if isinstance(quarter_start, datetime):
        # Determine quarter
        quarter = (quarter_start.month - 1) // 3 + 1
        start_date = datetime(quarter_start.year, (quarter - 1) * 3 + 1, 1)
    else:
        quarter = (quarter_start.month - 1) // 3 + 1
        start_date = datetime(quarter_start.year, (quarter - 1) * 3 + 1, 1)
    
    # Calculate end date (start of next quarter)
    if quarter == 4:
        end_date = datetime(start_date.year + 1, 1, 1)
    else:
        end_date = datetime(start_date.year, quarter * 3 + 1, 1)
    
    # Get submissions for the quarter
    submissions = get_submissions_query(db, user, start_date, end_date).all()
    total_reports = len(submissions)
    
    # Count by threat domain
    threat_counts = {}
    for sub in submissions:
        threat = sub.threat_domain
        threat_counts[threat] = threat_counts.get(threat, 0) + 1
    
    # Get previous quarter for comparison
    if quarter == 1:
        prev_start = datetime(start_date.year - 1, 10, 1)
        prev_end = datetime(start_date.year, 1, 1)
    else:
        prev_start = datetime(start_date.year, (quarter - 2) * 3 + 1, 1)
        prev_end = start_date
    
    prev_submissions = get_submissions_query(db, user, prev_start, prev_end).all()
    prev_threat_counts = {}
    for sub in prev_submissions:
        threat = sub.threat_domain
        prev_threat_counts[threat] = prev_threat_counts.get(threat, 0) + 1
    
    # Generate trend analysis
    trend_analysis = calculate_trends(threat_counts, prev_threat_counts)
    
    # State risk profiling
    state_risk_profiling = get_state_risk_profiling(db, user, start_date, end_date)
    
    # Top threats
    top_threats = get_top_threats(db, user, start_date, end_date, limit=15)
    
    # Count RED alerts
    red_alerts = sum(
        1 for threat, count in threat_counts.items()
        if count >= config.red_alert_threshold * 20  # Quarterly threshold
    )
    
    # Comparative analysis
    total_change = total_reports - len(prev_submissions)
    percent_change = (total_change / len(prev_submissions) * 100) if prev_submissions else 0
    
    comparative_analysis = {
        "previous_quarter_total": len(prev_submissions),
        "current_quarter_total": total_reports,
        "change": total_change,
        "percent_change": round(percent_change, 2),
        "trend": "Increasing" if total_change > 0 else "Decreasing" if total_change < 0 else "Stable"
    }
    
    # Strategic recommendations
    strategic_recommendations = []
    if total_change > 0:
        strategic_recommendations.append(f"Increase in incidents ({total_change} more than previous quarter) - consider resource reallocation")
    if red_alerts > 5:
        strategic_recommendations.append(f"High number of RED alerts ({red_alerts}) - prioritize critical threat response")
    
    top_threat = max(threat_counts.items(), key=lambda x: x[1])[0] if threat_counts else None
    if top_threat:
        strategic_recommendations.append(f"Focus on {top_threat} - highest incident count this quarter")
    
    return QuarterlySitrepResponse(
        quarter_start=start_date,
        quarter_end=end_date,
        quarter_number=quarter,
        total_reports_quarter=total_reports,
        red_alerts_count=red_alerts,
        quarterly_trend_analysis=trend_analysis,
        state_risk_profiling=state_risk_profiling,
        top_threats=top_threats,
        comparative_analysis=comparative_analysis,
        strategic_recommendations=strategic_recommendations
    )

def generate_bi_annual_sitrep(db: Session, period_start: datetime, user: User) -> BiAnnualSitrepResponse:
    """Generate bi-annual (semi-annual) situation report"""
    config = get_config(db)
    
    if isinstance(period_start, datetime):
        # Determine if first or second half
        if period_start.month <= 6:
            start_date = datetime(period_start.year, 1, 1)
            end_date = datetime(period_start.year, 7, 1)
            period_name = "First Half"
        else:
            start_date = datetime(period_start.year, 7, 1)
            end_date = datetime(period_start.year + 1, 1, 1)
            period_name = "Second Half"
    else:
        if period_start.month <= 6:
            start_date = datetime(period_start.year, 1, 1)
            end_date = datetime(period_start.year, 7, 1)
            period_name = "First Half"
        else:
            start_date = datetime(period_start.year, 7, 1)
            end_date = datetime(period_start.year + 1, 1, 1)
            period_name = "Second Half"
    
    # Get submissions for the period
    submissions = get_submissions_query(db, user, start_date, end_date).all()
    total_reports = len(submissions)
    
    # Count by threat domain
    threat_counts = {}
    for sub in submissions:
        threat = sub.threat_domain
        threat_counts[threat] = threat_counts.get(threat, 0) + 1
    
    # Get previous bi-annual period for comparison
    if period_name == "First Half":
        prev_start = datetime(start_date.year - 1, 7, 1)
        prev_end = datetime(start_date.year, 1, 1)
    else:
        prev_start = datetime(start_date.year, 1, 1)
        prev_end = start_date
    
    prev_submissions = get_submissions_query(db, user, prev_start, prev_end).all()
    prev_threat_counts = {}
    for sub in prev_submissions:
        threat = sub.threat_domain
        prev_threat_counts[threat] = prev_threat_counts.get(threat, 0) + 1
    
    # Generate trend analysis
    trend_analysis = calculate_trends(threat_counts, prev_threat_counts)
    
    # State risk profiling
    state_risk_profiling = get_state_risk_profiling(db, user, start_date, end_date)
    
    # Top threats
    top_threats = get_top_threats(db, user, start_date, end_date, limit=20)
    
    # Count RED alerts
    red_alerts = sum(
        1 for threat, count in threat_counts.items()
        if count >= config.red_alert_threshold * 40  # Bi-annual threshold
    )
    
    # Comparative analysis
    total_change = total_reports - len(prev_submissions)
    percent_change = (total_change / len(prev_submissions) * 100) if prev_submissions else 0
    
    comparative_analysis = {
        "previous_period_total": len(prev_submissions),
        "current_period_total": total_reports,
        "change": total_change,
        "percent_change": round(percent_change, 2),
        "trend": "Increasing" if total_change > 0 else "Decreasing" if total_change < 0 else "Stable"
    }
    
    # Performance metrics
    avg_daily = total_reports / ((end_date - start_date).days) if (end_date - start_date).days > 0 else 0
    high_severity_count = sum(
        1 for sub in submissions if sub.severity in ["High", "Critical"]
    )
    
    performance_metrics = {
        "total_incidents": total_reports,
        "average_daily_incidents": round(avg_daily, 2),
        "high_severity_incidents": high_severity_count,
        "high_severity_percentage": round((high_severity_count / total_reports * 100) if total_reports > 0 else 0, 2),
        "red_alerts": red_alerts,
        "states_covered": len(set(sub.state for sub in submissions))
    }
    
    # Strategic recommendations
    strategic_recommendations = []
    if total_change > 0:
        strategic_recommendations.append(f"Significant increase in incidents ({total_change} more) - review operational strategies")
    if red_alerts > 10:
        strategic_recommendations.append(f"Critical alert level: {red_alerts} RED alerts require immediate attention")
    if avg_daily > 10:
        strategic_recommendations.append(f"High daily average ({round(avg_daily, 2)} incidents/day) - consider resource augmentation")
    
    return BiAnnualSitrepResponse(
        period_start=start_date,
        period_end=end_date,
        period_name=period_name,
        total_reports_period=total_reports,
        red_alerts_count=red_alerts,
        trend_analysis=trend_analysis,
        state_risk_profiling=state_risk_profiling,
        top_threats=top_threats,
        comparative_analysis=comparative_analysis,
        strategic_recommendations=strategic_recommendations,
        performance_metrics=performance_metrics
    )

def generate_yearly_sitrep(db: Session, year: int, user: User) -> YearlySitrepResponse:
    """Generate yearly situation report"""
    config = get_config(db)
    
    start_date = datetime(year, 1, 1)
    end_date = datetime(year + 1, 1, 1)
    
    # Get submissions for the year
    submissions = get_submissions_query(db, user, start_date, end_date).all()
    total_reports = len(submissions)
    
    # Count by threat domain
    threat_counts = {}
    for sub in submissions:
        threat = sub.threat_domain
        threat_counts[threat] = threat_counts.get(threat, 0) + 1
    
    # Get previous year for comparison
    prev_start = datetime(year - 1, 1, 1)
    prev_end = start_date
    
    prev_submissions = get_submissions_query(db, user, prev_start, prev_end).all()
    prev_threat_counts = {}
    for sub in prev_submissions:
        threat = sub.threat_domain
        prev_threat_counts[threat] = prev_threat_counts.get(threat, 0) + 1
    
    # Generate trend analysis
    trend_analysis = calculate_trends(threat_counts, prev_threat_counts)
    
    # State risk profiling
    state_risk_profiling = get_state_risk_profiling(db, user, start_date, end_date)
    
    # Top threats
    top_threats = get_top_threats(db, user, start_date, end_date, limit=25)
    
    # Count RED alerts
    red_alerts = sum(
        1 for threat, count in threat_counts.items()
        if count >= config.red_alert_threshold * 80  # Yearly threshold
    )
    
    # Comparative analysis
    total_change = total_reports - len(prev_submissions)
    percent_change = (total_change / len(prev_submissions) * 100) if prev_submissions else 0
    
    comparative_analysis = {
        "previous_year_total": len(prev_submissions),
        "current_year_total": total_reports,
        "change": total_change,
        "percent_change": round(percent_change, 2),
        "trend": "Increasing" if total_change > 0 else "Decreasing" if total_change < 0 else "Stable"
    }
    
    # Performance metrics
    avg_daily = total_reports / 365
    high_severity_count = sum(
        1 for sub in submissions if sub.severity in ["High", "Critical"]
    )
    avg_monthly = total_reports / 12
    
    performance_metrics = {
        "total_incidents": total_reports,
        "average_daily_incidents": round(avg_daily, 2),
        "average_monthly_incidents": round(avg_monthly, 2),
        "high_severity_incidents": high_severity_count,
        "high_severity_percentage": round((high_severity_count / total_reports * 100) if total_reports > 0 else 0, 2),
        "red_alerts": red_alerts,
        "states_covered": len(set(sub.state for sub in submissions)),
        "threat_types_tracked": len(threat_counts)
    }
    
    # Strategic recommendations
    strategic_recommendations = []
    if total_change > 0:
        strategic_recommendations.append(f"Year-over-year increase of {total_change} incidents ({round(percent_change, 2)}%) - comprehensive review required")
    else:
        strategic_recommendations.append(f"Year-over-year decrease of {abs(total_change)} incidents - maintain current strategies")
    
    if red_alerts > 20:
        strategic_recommendations.append(f"Critical: {red_alerts} RED alerts throughout the year - prioritize threat mitigation")
    
    top_threat = max(threat_counts.items(), key=lambda x: x[1])[0] if threat_counts else None
    if top_threat:
        strategic_recommendations.append(f"Primary focus area: {top_threat} with {threat_counts[top_threat]} incidents")
    
    if avg_daily > 5:
        strategic_recommendations.append(f"Sustained high activity: {round(avg_daily, 2)} incidents per day average")
    
    # Annual summary
    annual_summary = f"""
    Annual Situation Report for {year}
    
    Total Incidents: {total_reports}
    High Severity Incidents: {high_severity_count} ({round((high_severity_count / total_reports * 100) if total_reports > 0 else 0, 2)}%)
    RED Alerts: {red_alerts}
    States Covered: {len(set(sub.state for sub in submissions))}
    Threat Types Tracked: {len(threat_counts)}
    
    Year-over-Year Change: {total_change} incidents ({round(percent_change, 2)}%)
    Trend: {comparative_analysis['trend']}
    
    This report provides a comprehensive overview of security incidents and threats
    across all state commands for the calendar year {year}.
    """
    
    return YearlySitrepResponse(
        year_start=start_date,
        year_end=end_date,
        year=year,
        total_reports_year=total_reports,
        red_alerts_count=red_alerts,
        annual_trend_analysis=trend_analysis,
        state_risk_profiling=state_risk_profiling,
        top_threats=top_threats,
        comparative_analysis=comparative_analysis,
        strategic_recommendations=strategic_recommendations,
        performance_metrics=performance_metrics,
        annual_summary=annual_summary.strip()
    )
