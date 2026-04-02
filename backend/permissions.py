"""Role-based permissions system based on police ranks"""
from models import PoliceRank, UserRole
from typing import List

# Rank hierarchy (higher number = higher rank)
RANK_HIERARCHY = {
    "IGP": 10,
    "DIG": 9,
    "AIG": 8,
    "CP": 7,
    "DCP": 6,
    "ACP": 5,
    "CSP": 4,
    "SP": 3,
    "DSP": 2,
    "ASP": 1
}

def get_rank_level(rank: str) -> int:
    """Get numeric level of a rank"""
    return RANK_HIERARCHY.get(rank, 0)

def can_access_rank(user_rank: str, target_rank: str) -> bool:
    """Check if user can access/modify users of target rank"""
    user_level = get_rank_level(user_rank)
    target_level = get_rank_level(target_rank)
    return user_level > target_level

class Permissions:
    """Permission definitions for each rank"""
    
    # IGP - Full system access
    IGP = {
        "view_all_reports": True,
        "view_all_submissions": True,
        "view_all_states": True,
        "create_users": True,
        "modify_users": True,
        "delete_users": True,
        "view_audit_logs": True,
        "modify_config": True,
        "export_data": True,
        "view_analytics": True,
        "manage_agencies": True,
        "view_all_collaborations": True,
    }
    
    # DIG - National level access
    DIG = {
        "view_all_reports": True,
        "view_all_submissions": True,
        "view_all_states": True,
        "create_users": True,
        "modify_users": True,  # Can modify AIG and below
        "delete_users": False,  # Cannot delete
        "view_audit_logs": True,
        "modify_config": False,
        "export_data": True,
        "view_analytics": True,
        "manage_agencies": True,
        "view_all_collaborations": True,
    }
    
    # AIG - Zonal level access
    AIG = {
        "view_all_reports": True,
        "view_all_submissions": True,
        "view_all_states": True,  # Zonal states
        "create_users": True,
        "modify_users": True,  # Can modify CP and below
        "delete_users": False,
        "view_audit_logs": True,
        "modify_config": False,
        "export_data": True,
        "view_analytics": True,
        "manage_agencies": False,
        "view_all_collaborations": True,
    }
    
    # CP - State level access
    CP = {
        "view_all_reports": True,
        "view_all_submissions": True,
        "view_all_states": False,  # Only own state
        "create_users": True,
        "modify_users": True,  # Can modify DCP and below
        "delete_users": False,
        "view_audit_logs": True,
        "modify_config": False,
        "export_data": True,
        "view_analytics": True,
        "manage_agencies": False,
        "view_all_collaborations": False,  # Only own state
    }
    
    # DCP - State level access
    DCP = {
        "view_all_reports": True,
        "view_all_submissions": True,
        "view_all_states": False,
        "create_users": True,
        "modify_users": True,  # Can modify ACP and below
        "delete_users": False,
        "view_audit_logs": False,
        "modify_config": False,
        "export_data": True,
        "view_analytics": True,
        "manage_agencies": False,
        "view_all_collaborations": False,
    }
    
    # ACP - Area/Division level
    ACP = {
        "view_all_reports": True,
        "view_all_submissions": True,
        "view_all_states": False,
        "create_users": True,
        "modify_users": True,  # Can modify CSP and below
        "delete_users": False,
        "view_audit_logs": False,
        "modify_config": False,
        "export_data": True,
        "view_analytics": True,
        "manage_agencies": False,
        "view_all_collaborations": False,
    }
    
    # CSP - Area/Division level
    CSP = {
        "view_all_reports": True,
        "view_all_submissions": True,
        "view_all_states": False,
        "create_users": True,
        "modify_users": True,  # Can modify SP and below
        "delete_users": False,
        "view_audit_logs": False,
        "modify_config": False,
        "export_data": False,
        "view_analytics": True,
        "manage_agencies": False,
        "view_all_collaborations": False,
    }
    
    # SP - Station/Area level
    SP = {
        "view_all_reports": True,
        "view_all_submissions": True,
        "view_all_states": False,
        "create_users": True,
        "modify_users": True,  # Can modify DSP and below
        "delete_users": False,
        "view_audit_logs": False,
        "modify_config": False,
        "export_data": False,
        "view_analytics": False,
        "manage_agencies": False,
        "view_all_collaborations": False,
    }
    
    # DSP - Station level
    DSP = {
        "view_all_reports": True,
        "view_all_submissions": True,
        "view_all_states": False,
        "create_users": True,
        "modify_users": True,  # Can modify ASP
        "delete_users": False,
        "view_audit_logs": False,
        "modify_config": False,
        "export_data": False,
        "view_analytics": False,
        "manage_agencies": False,
        "view_all_collaborations": False,
    }
    
    # ASP - Entry level
    ASP = {
        "view_all_reports": False,  # Only own submissions
        "view_all_submissions": False,  # Only own submissions
        "view_all_states": False,
        "create_users": False,
        "modify_users": False,
        "delete_users": False,
        "view_audit_logs": False,
        "modify_config": False,
        "export_data": False,
        "view_analytics": False,
        "manage_agencies": False,
        "view_all_collaborations": False,
    }

def get_permissions(rank: str) -> dict:
    """Get permissions for a given rank"""
    rank_permissions = {
        "IGP": Permissions.IGP,
        "DIG": Permissions.DIG,
        "AIG": Permissions.AIG,
        "CP": Permissions.CP,
        "DCP": Permissions.DCP,
        "ACP": Permissions.ACP,
        "CSP": Permissions.CSP,
        "SP": Permissions.SP,
        "DSP": Permissions.DSP,
        "ASP": Permissions.ASP,
    }
    return rank_permissions.get(rank, Permissions.ASP)

def has_permission(user: 'User', permission: str) -> bool:
    """Check if user has a specific permission"""
    # Admin role has all permissions
    if user.role == "admin":
        return True
    
    # Get permissions for user's rank
    permissions = get_permissions(user.rank or "ASP")
    return permissions.get(permission, False)

def can_modify_user(current_user: 'User', target_user: 'User') -> bool:
    """Check if current user can modify target user"""
    # Admin can modify anyone
    if current_user.role == "admin":
        return True
    
    # Can only modify users of lower rank
    if not current_user.rank or not target_user.rank:
        return False
    
    return can_access_rank(current_user.rank, target_user.rank)

def can_view_state(current_user: 'User', target_state: str) -> bool:
    """Check if user can view data for a state"""
    if has_permission(current_user, "view_all_states"):
        return True
    
    return current_user.state == target_state
