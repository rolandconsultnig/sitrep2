# Police Rank Hierarchy and Permissions

## Rank Structure (Highest to Lowest)

1. **IGP** - Inspector General of Police
2. **DIG** - Deputy Inspector General
3. **AIG** - Assistant Inspector General
4. **CP** - Commissioner of Police
5. **DCP** - Deputy Commissioner of Police
6. **ACP** - Assistant Commissioner of Police
7. **CSP** - Chief Superintendent of Police
8. **SP** - Superintendent of Police
9. **DSP** - Deputy Superintendent of Police
10. **ASP** - Assistant Superintendent of Police

## Permission Matrix

### IGP (Inspector General of Police)
**Full System Access**
- ✅ View all reports (all states, all periods)
- ✅ View all submissions (all states)
- ✅ Create users (all ranks)
- ✅ Modify users (all ranks)
- ✅ Delete users
- ✅ View audit logs
- ✅ Modify system configuration
- ✅ Export data
- ✅ View all analytics
- ✅ Manage agencies
- ✅ View all collaborations

### DIG (Deputy Inspector General)
**National Level Access**
- ✅ View all reports (all states)
- ✅ View all submissions (all states)
- ✅ Create users (AIG and below)
- ✅ Modify users (AIG and below)
- ❌ Delete users
- ✅ View audit logs
- ❌ Modify system configuration
- ✅ Export data
- ✅ View all analytics
- ✅ Manage agencies
- ✅ View all collaborations

### AIG (Assistant Inspector General)
**Zonal Level Access**
- ✅ View all reports (zonal states)
- ✅ View all submissions (zonal states)
- ✅ Create users (CP and below)
- ✅ Modify users (CP and below)
- ❌ Delete users
- ✅ View audit logs
- ❌ Modify system configuration
- ✅ Export data
- ✅ View all analytics
- ❌ Manage agencies
- ✅ View all collaborations (zonal)

### CP (Commissioner of Police)
**State Level Access**
- ✅ View all reports (own state only)
- ✅ View all submissions (own state only)
- ✅ Create users (DCP and below)
- ✅ Modify users (DCP and below)
- ❌ Delete users
- ✅ View audit logs
- ❌ Modify system configuration
- ✅ Export data
- ✅ View all analytics
- ❌ Manage agencies
- ❌ View all collaborations (own state only)

### DCP (Deputy Commissioner of Police)
**State Level Access**
- ✅ View all reports (own state)
- ✅ View all submissions (own state)
- ✅ Create users (ACP and below)
- ✅ Modify users (ACP and below)
- ❌ Delete users
- ❌ View audit logs
- ❌ Modify system configuration
- ✅ Export data
- ✅ View all analytics
- ❌ Manage agencies
- ❌ View all collaborations (own state)

### ACP (Assistant Commissioner of Police)
**Area/Division Level**
- ✅ View all reports (own state)
- ✅ View all submissions (own state)
- ✅ Create users (CSP and below)
- ✅ Modify users (CSP and below)
- ❌ Delete users
- ❌ View audit logs
- ❌ Modify system configuration
- ✅ Export data
- ✅ View all analytics
- ❌ Manage agencies
- ❌ View all collaborations (own state)

### CSP (Chief Superintendent of Police)
**Area/Division Level**
- ✅ View all reports (own state)
- ✅ View all submissions (own state)
- ✅ Create users (SP and below)
- ✅ Modify users (SP and below)
- ❌ Delete users
- ❌ View audit logs
- ❌ Modify system configuration
- ❌ Export data
- ✅ View all analytics
- ❌ Manage agencies
- ❌ View all collaborations (own state)

### SP (Superintendent of Police)
**Station/Area Level**
- ✅ View all reports (own state)
- ✅ View all submissions (own state)
- ✅ Create users (DSP and below)
- ✅ Modify users (DSP and below)
- ❌ Delete users
- ❌ View audit logs
- ❌ Modify system configuration
- ❌ Export data
- ❌ View all analytics
- ❌ Manage agencies
- ❌ View all collaborations (own state)

### DSP (Deputy Superintendent of Police)
**Station Level**
- ✅ View all reports (own state)
- ✅ View all submissions (own state)
- ✅ Create users (ASP only)
- ✅ Modify users (ASP only)
- ❌ Delete users
- ❌ View audit logs
- ❌ Modify system configuration
- ❌ Export data
- ❌ View all analytics
- ❌ Manage agencies
- ❌ View all collaborations (own state)

### ASP (Assistant Superintendent of Police)
**Entry Level - Limited Access**
- ❌ View all reports (only own submissions)
- ❌ View all submissions (only own submissions)
- ❌ View all states
- ❌ Create users
- ❌ Modify users
- ❌ Delete users
- ❌ View audit logs
- ❌ Modify system configuration
- ❌ Export data
- ❌ View all analytics
- ❌ Manage agencies
- ❌ View all collaborations

## Key Rules

1. **Rank Hierarchy**: Users can only manage users of lower rank
2. **State Access**: Lower ranks can only access their assigned state
3. **Submission Access**: ASP can only see their own submissions
4. **Report Access**: ASP cannot generate reports, only view their own data
5. **User Management**: Only ranks with `create_users` permission can create users
6. **Audit Logs**: Only IGP, DIG, AIG, CP, DCP can view audit logs
7. **Configuration**: Only IGP can modify system configuration
8. **Export**: Only ranks CSP and above can export data
9. **Analytics**: Only ranks SP and above can view advanced analytics

## User Profile Fields

All users have:
- **Service Number** (unique identifier)
- **Rank** (police rank)
- **State** (assigned state command)
- **LGA** (Local Government Area)
- **Department** (unit/department assignment)
- **Phone Number**
- **Last Login** (tracked automatically)

## Implementation Notes

- Permissions are enforced at the API level
- Frontend shows/hides features based on user permissions
- Rank hierarchy is strictly enforced
- Users cannot escalate their own rank
- All user management actions are audit logged
