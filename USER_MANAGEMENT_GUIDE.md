# User Management System Guide

## Overview

The NPF Smart SITREP System now includes a comprehensive user management system with police rank hierarchy and role-based access control. Users are assigned ranks that determine their permissions and access levels throughout the system.

## Police Ranks

The system supports 10 police ranks (from highest to lowest):

1. **IGP** - Inspector General of Police (Full system access)
2. **DIG** - Deputy Inspector General (National level)
3. **AIG** - Assistant Inspector General (Zonal level)
4. **CP** - Commissioner of Police (State level)
5. **DCP** - Deputy Commissioner of Police (State level)
6. **ACP** - Assistant Commissioner of Police (Area/Division level)
7. **CSP** - Chief Superintendent of Police (Area/Division level)
8. **SP** - Superintendent of Police (Station/Area level)
9. **DSP** - Deputy Superintendent of Police (Station level)
10. **ASP** - Assistant Superintendent of Police (Entry level - Limited access)

## User Profile Fields

Each user has the following profile information:

- **Service Number** (unique identifier, cannot be changed)
- **Username** (unique, cannot be changed after creation)
- **Email** (unique)
- **Full Name**
- **Rank** (police rank, cannot be changed by user)
- **State** (assigned state command, cannot be changed by user)
- **LGA** (Local Government Area)
- **Department** (unit/department assignment)
- **Phone Number**
- **Role** (admin, state_commander, officer)
- **Status** (active/inactive)
- **Last Login** (automatically tracked)
- **Created At** (registration date)

## Access Control Rules

### Rank Hierarchy
- Users can only manage (create, modify, delete) users of **lower rank**
- Users can only view users of **equal or lower rank**
- Users cannot escalate their own rank

### State Access
- Lower ranks can only access data for their **assigned state**
- Higher ranks (IGP, DIG, AIG) can access **all states**
- CP and below are restricted to their **own state**

### Submission Access
- **ASP** can only view their **own submissions**
- **DSP and above** can view **all submissions** in their state
- **IGP, DIG, AIG** can view **all submissions** across all states

### Report Access
- **ASP** cannot generate reports (only view own data)
- **DSP and above** can generate all report types for their state
- **IGP, DIG, AIG** can generate reports for all states

### Analytics Access
- **SP and below** cannot access advanced analytics
- **CSP and above** can view analytics for their state
- **IGP, DIG, AIG** can view analytics for all states

### Audit Logs
- Only **IGP, DIG, AIG, CP, DCP** can view audit logs
- All user management actions are automatically logged

### Configuration
- Only **IGP** can modify system configuration

## User Management Features

### Creating Users
1. Navigate to **Users** menu (visible if you have `create_users` permission)
2. Click **New User** button
3. Fill in required fields:
   - Username (unique)
   - Email (unique)
   - Password
   - Full Name
   - Rank (must be lower than your rank)
   - Service Number (unique)
   - State
   - Optional: LGA, Department, Phone Number
4. Click **Create User**

**Note**: You can only create users with ranks lower than your own.

### Viewing Users
- Users list shows all users you have permission to view
- Filter by State, Rank, or Status
- Click on a user to view full profile

### Editing Users
1. Click **Edit** button next to a user
2. Modify allowed fields (rank and state cannot be changed)
3. Click **Save Changes**

**Note**: You can only edit users of lower rank.

### Deactivating Users
1. Click **Deactivate** button next to an active user
2. Confirm the action
3. User account is deactivated (soft delete)

### Activating Users
1. Click **Activate** button next to an inactive user
2. User account is reactivated

**Note**: You can only activate/deactivate users of lower rank.

## Profile Management

### Viewing Your Profile
1. Click **Profile** link in the navigation bar
2. View your complete profile information
3. View your permissions based on your rank

### Editing Your Profile
1. Click **Edit Profile** button
2. Modify allowed fields:
   - Full Name
   - Email
   - LGA
   - Department
   - Phone Number
3. Click **Save Changes**

**Note**: Service Number, Rank, and State cannot be changed by users.

## Permissions Matrix

See `RANK_PERMISSIONS.md` for a detailed permissions matrix showing what each rank can and cannot do.

## Sample Users

The system includes sample users for testing:

- **admin** (IGP) - Full access
- **dig_sample** (DIG) - National level access
- **aig_sample** (AIG) - Zonal level access
- **cp_lagos** (CP) - State level access
- **dcp_sample** (DCP) - State level access
- **asp_field** (ASP) - Limited access

All sample users have password: `password123`

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt
2. **Token-based Authentication**: JWT tokens for API access
3. **Audit Logging**: All user management actions are logged
4. **Account Status**: Inactive accounts cannot login
5. **Rank Validation**: Rank hierarchy is strictly enforced
6. **State Isolation**: Lower ranks can only access their state data

## API Endpoints

### User Management
- `GET /api/users` - List users (with filters)
- `GET /api/users/{user_id}` - Get user profile
- `GET /api/users/me` - Get current user profile
- `POST /api/users/register` - Create new user
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Deactivate user
- `PUT /api/users/{user_id}/activate` - Activate user

All endpoints require authentication and enforce rank-based permissions.

## Frontend Components

1. **UserManagement.jsx** - Full user management interface
2. **Profile.jsx** - User profile view and edit

## Database Schema

The `users` table includes:
- `id` (primary key)
- `username` (unique)
- `email` (unique)
- `hashed_password`
- `full_name`
- `rank` (indexed)
- `service_number` (unique, indexed)
- `state` (indexed)
- `lga`
- `department`
- `phone_number`
- `role`
- `is_active`
- `last_login`
- `created_at`
- `updated_at`

## Initialization

To initialize the system with sample users:

```bash
python backend/init_db.py      # Creates admin user
python backend/init_agencies.py  # Creates agencies
python backend/init_ranks.py     # Creates sample users for each rank
```

## Best Practices

1. **Service Numbers**: Use a consistent format (e.g., NPF-00001)
2. **Rank Assignment**: Assign ranks based on actual police hierarchy
3. **State Assignment**: Ensure users are assigned to correct state commands
4. **Password Policy**: Enforce strong passwords (implement in production)
5. **Regular Audits**: Review audit logs regularly for security
6. **Account Management**: Deactivate accounts when officers are transferred or retired

## Troubleshooting

### User cannot see Users menu
- Check if user has `create_users` permission
- Only ranks DSP and above can see Users menu

### Cannot create user with certain rank
- You can only create users with ranks lower than your own
- Check your rank in your profile

### Cannot view certain users
- You can only view users of equal or lower rank
- Check rank hierarchy

### Account deactivated
- Contact a user with higher rank to reactivate your account
- Only users with `modify_users` permission can activate accounts
