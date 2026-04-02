# NPF Smart SITREP System

A web-based Situation Report (SITREP) system for the Nigeria Police Force, supporting all 36 states plus FCT. This system automates intelligence reporting, risk assessment, and generates daily/weekly situation reports.

## Features

- **Multi-State Support**: All 36 Nigerian states + FCT
- **User Authentication**: Role-based access (Admin, State Commander, Officer)
- **Incident Submissions**: Submit and track incident reports
- **Automated Report Generation**:
  - Daily SITREP
  - Weekly SITREP
  - Daily Risk Matrix
  - Weekly Risk Matrix
- **Risk Assessment**: Automatic RED/AMBER/GREEN flagging
- **Action Recommendations**: Auto-suggested response actions based on threat type
- **Trend Analysis**: Weekly trend monitoring

## Technology Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite
- **Database**: SQLite (can be upgraded to PostgreSQL)
- **Authentication**: JWT tokens

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the project root directory
2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize the database:
```bash
cd backend
python init_db.py
```

This creates:
- Database tables
- Default admin user (username: `admin`, password: `admin123`)
- Default configuration

⚠️ **Important**: Change the admin password after first login!

4. Start the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3010`

## Usage

### Default Login

- **Username**: `admin`
- **Password**: `admin123`

### Creating Users

1. Login as admin
2. Use the API endpoint `/api/users/register` to create new users
3. Or use the Swagger UI at `http://localhost:8000/docs`

Example user creation:
```json
{
  "username": "lagos_officer",
  "email": "officer@lagos.npf.gov.ng",
  "password": "secure_password",
  "full_name": "Lagos State Officer",
  "state": "Lagos",
  "role": "officer"
}
```

### Roles

- **admin**: Full access to all states and system configuration
- **state_commander**: Access to their assigned state only
- **officer**: Access to their assigned state only

### Submitting Incidents

1. Navigate to "Submissions" in the web interface
2. Click "New Submission"
3. Fill in all required fields:
   - Report Date
   - State (auto-filled for non-admin users)
   - LGA or Address
   - Threat Domain (crime type)
   - Severity
   - Narrative
4. Optional fields: Trend, Source Reliability, Source Credibility, Other Agency
5. Click "Submit"

### Viewing Reports

1. Navigate to "Reports"
2. Select report type:
   - Daily SITREP
   - Weekly SITREP
   - Daily Risk Matrix
   - Weekly Risk Matrix
3. Select date
4. Click "Generate Report"

### Configuration

Admins can configure:
- Daily report date and window
- Week start/end dates
- High severity threshold
- RED alert threshold

Navigate to "Config" (admin only) to update settings.

## API Endpoints

### Authentication
- `POST /token` - Login
- `GET /api/users/me` - Get current user info

### Submissions
- `POST /api/submissions` - Create submission
- `GET /api/submissions` - List submissions (filtered by state for non-admins)
- `GET /api/submissions/{id}` - Get submission details

### Reports
- `GET /api/reports/daily-sitrep` - Generate daily SITREP
- `GET /api/reports/weekly-sitrep` - Generate weekly SITREP
- `GET /api/reports/daily-risk-matrix` - Generate daily risk matrix
- `GET /api/reports/weekly-risk-matrix` - Generate weekly risk matrix

### Configuration
- `GET /api/config` - Get configuration
- `PUT /api/config` - Update configuration (admin only)

## Threat Types Supported

1. Kidnapping
2. Armed Robbery
3. Banditry
4. Terrorism
5. Cultism
6. Rape / Sexual Violence
7. Cybercrime
8. Homicide
9. Drug trafficking
10. Human trafficking

## States Supported

All 36 Nigerian states plus FCT:
Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa, Benue, Borno, Cross River, Delta, Ebonyi, Edo, Ekiti, Enugu, FCT, Gombe, Imo, Jigawa, Kaduna, Kano, Katsina, Kebbi, Kogi, Kwara, Lagos, Nasarawa, Niger, Ogun, Ondo, Osun, Oyo, Plateau, Rivers, Sokoto, Taraba, Yobe, Zamfara

## Production Deployment

### Security Considerations

1. **Change default admin password** immediately
2. **Set SECRET_KEY** in `backend/auth.py` to a strong random value
3. **Use environment variables** for sensitive configuration
4. **Upgrade to PostgreSQL** for production
5. **Enable HTTPS**
6. **Set up proper CORS** origins
7. **Implement rate limiting**
8. **Add logging and monitoring**

### Database Migration

To use PostgreSQL instead of SQLite:

1. Update `backend/database.py`:
```python
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/npf_sitrep"
```

2. Install PostgreSQL driver:
```bash
pip install psycopg2-binary
```

## Development

### Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication logic
│   ├── report_generator.py  # Report generation logic
│   └── init_db.py           # Database initialization
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   └── package.json
├── requirements.txt         # Python dependencies
└── README.md
```

## License

This project is developed for the Nigeria Police Force.

## Support

For issues or questions, please contact the development team.
