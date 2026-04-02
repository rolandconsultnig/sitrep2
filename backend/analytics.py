"""Advanced analytics and predictive capabilities"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from models import Submission
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import pickle
import os

def prepare_training_data(db: Session, days: int = 90):
    """Prepare historical data for model training"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    submissions = db.query(Submission).filter(
        and_(
            Submission.report_date >= start_date,
            Submission.report_date < end_date
        )
    ).all()
    
    if not submissions:
        return None
    
    data = []
    for sub in submissions:
        data.append({
            'date': sub.report_date,
            'day_of_week': sub.report_date.weekday(),
            'hour': sub.report_date.hour,
            'state': sub.state,
            'threat': sub.threat_domain,
            'severity': sub.severity,
            'month': sub.report_date.month
        })
    
    df = pd.DataFrame(data)
    return df

def predict_hotspots(db: Session, days_ahead: int = 7) -> List[Dict]:
    """
    Predict crime hotspots for the next N days
    Returns list of predictions with state, threat, and probability
    """
    try:
        # Get historical data
        df = prepare_training_data(db, days=90)
        if df is None or len(df) < 10:
            return []
        
        # Aggregate by state and threat
        daily_counts = df.groupby(['state', 'threat', df['date'].dt.date]).size().reset_index(name='count')
        
        # Simple prediction: average of last 7 days for each state-threat combination
        predictions = []
        recent_data = daily_counts[daily_counts['date'] >= (datetime.now().date() - timedelta(days=7))]
        
        for (state, threat), group in recent_data.groupby(['state', 'threat']):
            avg_count = group['count'].mean()
            if avg_count > 0:
                predictions.append({
                    'state': state,
                    'threat': threat,
                    'predicted_count': round(avg_count * days_ahead, 2),
                    'confidence': 'medium',
                    'risk_level': 'HIGH' if avg_count > 2 else 'MEDIUM' if avg_count > 1 else 'LOW'
                })
        
        # Sort by predicted count
        predictions.sort(key=lambda x: x['predicted_count'], reverse=True)
        return predictions[:20]  # Top 20 predictions
        
    except Exception as e:
        print(f"Error in hotspot prediction: {e}")
        return []

def detect_anomalies(db: Session, state: str = None, hours: int = 24) -> List[Dict]:
    """
    Detect anomalous patterns in recent submissions
    Returns list of anomalies detected
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(hours=hours)
        
        query = db.query(Submission).filter(
            Submission.report_date >= start_date
        )
        
        if state:
            query = query.filter(Submission.state == state)
        
        recent = query.all()
        
        if len(recent) < 5:
            return []
        
        # Calculate baseline (average of last 7 days before this period)
        baseline_start = start_date - timedelta(days=7)
        baseline = db.query(Submission).filter(
            and_(
                Submission.report_date >= baseline_start,
                Submission.report_date < start_date
            )
        ).count()
        
        baseline_avg = baseline / 7  # Average per day
        current_count = len(recent)
        
        anomalies = []
        
        # Check for spike in total incidents
        if current_count > baseline_avg * 2:
            anomalies.append({
                'type': 'spike',
                'description': f'Unusual spike: {current_count} incidents in last {hours}h vs baseline {baseline_avg:.1f}/day',
                'severity': 'HIGH',
                'state': state or 'ALL'
            })
        
        # Check for new threat types
        recent_threats = set(sub.threat_domain for sub in recent)
        baseline_threats = set(
            db.query(Submission.threat_domain).filter(
                and_(
                    Submission.report_date >= baseline_start,
                    Submission.report_date < start_date
                )
            ).distinct().all()
        )
        baseline_threats = {t[0] for t in baseline_threats}
        
        new_threats = recent_threats - baseline_threats
        if new_threats:
            anomalies.append({
                'type': 'new_threat',
                'description': f'New threat types detected: {", ".join(new_threats)}',
                'severity': 'MEDIUM',
                'state': state or 'ALL'
            })
        
        # Check for high severity concentration
        high_sev_count = sum(1 for sub in recent if sub.severity in ['High', 'Critical'])
        if high_sev_count > len(recent) * 0.5:  # More than 50% high severity
            anomalies.append({
                'type': 'high_severity_concentration',
                'description': f'High concentration of severe incidents: {high_sev_count}/{len(recent)}',
                'severity': 'HIGH',
                'state': state or 'ALL'
            })
        
        return anomalies
        
    except Exception as e:
        print(f"Error in anomaly detection: {e}")
        return []

def get_trend_forecast(db: Session, threat: str, state: str = None, days: int = 30) -> Dict:
    """
    Forecast trend for a specific threat type
    Returns forecast data with predicted counts
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days * 2)  # Get more data for better forecast
        
        query = db.query(Submission).filter(
            and_(
                Submission.report_date >= start_date,
                Submission.threat_domain == threat
            )
        )
        
        if state:
            query = query.filter(Submission.state == state)
        
        submissions = query.all()
        
        if len(submissions) < 10:
            return {'error': 'Insufficient data'}
        
        # Aggregate by date
        daily_data = {}
        for sub in submissions:
            date_key = sub.report_date.date()
            daily_data[date_key] = daily_data.get(date_key, 0) + 1
        
        # Simple moving average forecast
        dates = sorted(daily_data.keys())
        counts = [daily_data[d] for d in dates[-7:]]  # Last 7 days
        
        if len(counts) < 3:
            return {'error': 'Insufficient recent data'}
        
        avg = sum(counts) / len(counts)
        trend = 'increasing' if counts[-1] > counts[0] else 'decreasing' if counts[-1] < counts[0] else 'stable'
        
        # Simple forecast: use average with trend adjustment
        forecast_days = []
        forecast_counts = []
        for i in range(7):  # Next 7 days
            forecast_date = (datetime.now() + timedelta(days=i+1)).date()
            forecast_days.append(forecast_date.isoformat())
            # Simple projection
            if trend == 'increasing':
                predicted = avg * (1 + 0.1 * (i + 1))
            elif trend == 'decreasing':
                predicted = max(0, avg * (1 - 0.1 * (i + 1)))
            else:
                predicted = avg
            forecast_counts.append(round(predicted, 1))
        
        return {
            'threat': threat,
            'state': state or 'ALL',
            'current_average': round(avg, 2),
            'trend': trend,
            'forecast': {
                'dates': forecast_days,
                'predicted_counts': forecast_counts
            }
        }
        
    except Exception as e:
        print(f"Error in trend forecast: {e}")
        return {'error': str(e)}

def get_performance_metrics(db: Session, days: int = 30) -> Dict:
    """Calculate performance metrics for the system"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    submissions = db.query(Submission).filter(
        Submission.report_date >= start_date
    ).all()
    
    if not submissions:
        return {}
    
    total = len(submissions)
    high_sev = sum(1 for s in submissions if s.severity in ['High', 'Critical'])
    
    # Response time (if we had timestamps for response)
    # For now, calculate submission frequency
    states_covered = len(set(s.state for s in submissions))
    threats_tracked = len(set(s.threat_domain for s in submissions))
    
    # Calculate daily average
    days_actual = (end_date - start_date).days or 1
    daily_avg = total / days_actual
    
    return {
        'total_incidents': total,
        'high_severity_count': high_sev,
        'high_severity_percentage': round((high_sev / total * 100) if total > 0 else 0, 2),
        'average_daily_incidents': round(daily_avg, 2),
        'states_covered': states_covered,
        'threats_tracked': threats_tracked,
        'period_days': days_actual
    }
