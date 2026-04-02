# Quick Start Guide

## Prerequisites
- Python 3.8+ installed
- Node.js 16+ and npm installed

## One-Command Setup (Windows)

Run `setup.bat` - this will:
1. Install all Python dependencies
2. Initialize the database with admin user
3. Install all frontend dependencies

## Manual Setup

### Step 1: Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Initialize Database
```bash
cd backend
python init_db.py
cd ..
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

## Running the Application

### Option 1: Use Batch Files (Windows)
1. Open a terminal and run `start_backend.bat`
2. Open another terminal and run `start_frontend.bat`

### Option 2: Manual Start

**Backend:**
```bash
cd backend
python main.py
```
Backend runs on: http://localhost:8000

**Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:3010

## First Login

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change this password immediately after first login!

## Creating Additional Users

After logging in as admin, you can create users via the API:

1. Go to http://localhost:8000/docs (Swagger UI)
2. Use the `/api/users/register` endpoint
3. Or use curl:

```bash
curl -X POST "http://localhost:8000/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "lagos_officer",
    "email": "officer@lagos.npf.gov.ng",
    "password": "secure_password",
    "full_name": "Lagos State Officer",
    "state": "Lagos",
    "role": "officer"
  }'
```

## Testing the System

1. **Login** with admin credentials
2. **Create a submission**:
   - Go to "Submissions"
   - Click "New Submission"
   - Fill in the form and submit
3. **View Dashboard**:
   - See summary statistics
   - View top RED alerts
4. **Generate Reports**:
   - Go to "Reports"
   - Select report type and date
   - Click "Generate Report"

## Troubleshooting

### Backend won't start
- Check if port 8000 is available
- Verify Python dependencies are installed: `pip list`
- Check for errors in the terminal

### Frontend won't start
- Check if port 3010 is available
- Verify Node modules are installed: `cd frontend && npm list`
- Try deleting `node_modules` and running `npm install` again

### Database errors
- Delete `backend/npf_sitrep.db` and run `python backend/init_db.py` again
- Check file permissions

### Can't login
- Verify database was initialized: `python backend/init_db.py`
- Check username/password (default: admin/admin123)
- Check browser console for errors

## Next Steps

1. Change admin password
2. Create users for each state command
3. Configure system settings (thresholds, dates)
4. Start submitting incident reports
5. Generate and review reports

## API Documentation

Interactive API documentation available at:
http://localhost:8000/docs
