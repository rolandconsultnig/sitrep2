# Quick Start Guide - Advanced Features

## ✅ Setup Complete!

All advanced features have been successfully installed and configured:

### 1. Dependencies ✅
- Backend: websockets, python-socketio, scikit-learn
- Frontend: socket.io-client
- Database: All new tables created

### 2. Agencies Initialized ✅
- 8 agencies created (NPF, DSS, NSCDC, NAF, NDLEA, NAPTIP, EFCC, ICPC)

### 3. Routes Added ✅
- Real-Time Dashboard route added to frontend
- Navigation link in navbar

### 4. Server Running ✅
- Backend server on port 8000
- WebSocket endpoint ready at `/ws/{user_id}`

## 🚀 How to Test

### Test Real-Time Dashboard
1. **Start Frontend** (if not running):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Login** to the application at http://localhost:3010

3. **Navigate** to "Real-Time" in the navbar

4. **Watch for**:
   - Live stats updating every 30 seconds
   - Real-time notifications when new submissions are created
   - RED alert notifications
   - Predicted hotspots
   - Anomaly detection alerts

### Test WebSocket Connection
1. Open browser console (F12)
2. Navigate to Real-Time Dashboard
3. Look for "WebSocket connected" message in console
4. Create a new submission in another tab
5. Watch for real-time notification

### Test Analytics API
Use these endpoints (requires authentication):

```bash
# Get predicted hotspots
GET /api/analytics/hotspots?days_ahead=7

# Detect anomalies
GET /api/analytics/anomalies?hours=24

# Get trend forecast
GET /api/analytics/forecast?threat=Kidnapping&days=30

# Get performance metrics
GET /api/analytics/performance?days=30
```

### Test Collaboration
```bash
# Get agencies
GET /api/agencies

# Share submission
POST /api/collaborations
{
  "submission_id": 1,
  "agency_id": 2,
  "notes": "Joint operation"
}
```

### Test Audit Logs (Admin Only)
```bash
GET /api/audit-logs
```

## 📊 Features Available

### Real-Time Dashboard
- **Location**: `/realtime-dashboard`
- **Features**:
  - Live incident count
  - RED alerts counter
  - High severity incidents
  - Active states count
  - Recent submissions feed
  - Predicted hotspots
  - Anomaly detection
  - Performance metrics

### Analytics
- **Hotspot Prediction**: Predicts where crimes are likely to occur
- **Anomaly Detection**: Detects unusual patterns
- **Trend Forecasting**: Forecasts trends for threat types
- **Performance Metrics**: Calculates KPIs

### Collaboration
- **Agency Management**: 8 agencies registered
- **Submission Sharing**: Share incidents with other agencies
- **Status Tracking**: Track collaboration status

### Security
- **Audit Logging**: All actions logged
- **IP Tracking**: Track user IP addresses
- **Action History**: Complete audit trail

## 🔧 Troubleshooting

### WebSocket Not Connecting
1. Check browser console for errors
2. Verify backend is running: `netstat -ano | findstr ":8000"`
3. Check CORS settings in `backend/main.py`
4. Verify user is logged in (needs user.id)

### Analytics Not Working
1. Ensure you have submission data in database
2. Check API authentication (need valid token)
3. Verify scikit-learn is installed: `pip list | findstr scikit`

### Agencies Not Showing
1. Run: `python backend/init_agencies.py`
2. Check database: Agencies should be in `agencies` table

## 📱 Mobile App

The mobile app structure is ready:
- Location: `mobile/` directory
- Setup: `cd mobile && npm install`
- Start: `npx expo start`

## 🎯 Next Steps

1. **Test Real-Time Dashboard** - Open and verify live updates
2. **Create Test Submissions** - See real-time notifications
3. **Test Analytics** - Try hotspot predictions
4. **Test Collaboration** - Share a submission
5. **Review Audit Logs** - Check security tracking

## ✨ All Features Active!

Your NPF Smart SITREP System now has:
- ✅ Real-time dashboard with live updates
- ✅ Advanced analytics with predictions
- ✅ Enhanced security with audit logging
- ✅ Multi-agency collaboration
- ✅ Mobile app structure

**System is ready for use!**
