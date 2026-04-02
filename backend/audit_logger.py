"""Audit logging system for security and compliance"""
from sqlalchemy.orm import Session
from models import AuditLog, User
from datetime import datetime
from typing import Optional, Dict, Any
import json

def log_action(
    db: Session,
    user: User,
    action: str,
    resource_type: str,
    resource_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """
    Log an action to the audit log
    
    Actions: CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, EXPORT, SHARE
    Resource Types: SUBMISSION, USER, REPORT, CONFIG, COLLABORATION
    """
    audit_log = AuditLog(
        user_id=user.id,
        username=user.username,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details=json.dumps(details) if details else None,
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    db.commit()
    return audit_log

def get_audit_logs(
    db: Session,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100
):
    """Retrieve audit logs with filtering"""
    query = db.query(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
