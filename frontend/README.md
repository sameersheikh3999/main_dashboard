# Educational Dashboard System

A comprehensive educational management system with role-based dashboards for Federal Directorate of Education (FDE), Area Education Officers (AEOs), and School Principals.

## Features

- **Multi-Role Authentication**: Support for FDE, AEO, and Principal roles
- **FDE Dashboard**: National oversight with six sector management (B.K, Urban-I, Urban-II, Tarnol, Nilore, Sihala)
- **AEO Dashboard**: Regional performance monitoring and school management
- **Principal Dashboard**: School-level data and teacher performance tracking
- **Messaging System**: Inter-role communication capabilities
- **Data Visualization**: Charts and analytics for educational metrics
- **BigQuery Integration**: Real-time data analytics (optional)

## Technology Stack

### Frontend
- React.js
- Styled Components
- Recharts for data visualization
- PapaParse for CSV handling

### Backend Options
- **Node.js/Express** (Current)
- **Django REST Framework** (Alternative)

## Project Structure

```
new_dashboard/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── services/          # API services
│   └── ...
├── server/                # Backend servers
│   ├── server.js          # Node.js backend
│   ├── database.js        # SQLite database operations
│   └── django_backend/    # Django REST Framework backend
├── public/                # Static files
├── build/                 # Production build
└── ...
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+ (for Django backend)
- npm or yarn

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```
   The frontend will run on `http://localhost:3000`

### Backend Setup

#### Option 1: Node.js Backend (Current)

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   node server.js
   ```
   The backend will run on `http://localhost:5000`

#### Option 2: Django Backend

1. **Navigate to Django backend**:
   ```bash
   cd server/django_backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**:
   ```bash
   # Windows
   .\venv\Scripts\Activate.ps1
   
   # macOS/Linux
   source venv/bin/activate
   ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

6. **Start the server**:
   ```bash
   python manage.py runserver
   ```
   The Django backend will run on `http://localhost:8000`

## Default Users

### FDE User
- **Username**: `fde`
- **Password**: `fde123`
- **Role**: FDE (Federal Directorate of Education)

### AEO Users
- **Username**: `aeo_bk`, `aeo_urban1`, `aeo_urban2`, `aeo_tarnol`, `aeo_nilore`, `aeo_sihala`
- **Password**: `aeo123`
- **Role**: AEO (Area Education Officer)
- **Sectors**: B.K, Urban-I, Urban-II, Tarnol, Nilore, Sihala

### Principal Users
- **Username**: `principal_al_noor_elementary`, `principal_green_valley_high`, `principal_sunrise_primary`, `principal_heritage_middle`
- **Password**: `principal123`
- **Role**: Principal

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users
- `GET /api/principals` - Get all principals
- `GET /api/aeos` - Get all AEOs

### Messaging
- `GET /api/conversations` - Get conversations
- `POST /api/messages` - Send message
- `GET /api/messages/:conversationId` - Get messages for conversation

### BigQuery (Optional)
- `GET /api/bigquery/filter-options` - Get filter options
- `GET /api/bigquery/summary-stats` - Get summary statistics
- `GET /api/bigquery/teacher-data` - Get teacher data
- `GET /api/bigquery/aggregated-data` - Get aggregated data

## Features by Role

### FDE Dashboard
- Overview of all six AEO sectors
- National statistics and performance metrics
- Sector distribution visualization
- Direct messaging to AEOs
- BigQuery analytics integration

### AEO Dashboard
- Regional school management
- Teacher performance tracking
- Communication with principals
- Regional analytics and reports

### Principal Dashboard
- School-specific data
- Teacher performance monitoring
- Communication with AEO
- Local analytics

## Development

### Adding New Features
1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and test
3. Commit changes: `git commit -m "Add new feature"`
4. Push to branch: `git push origin feature/new-feature`
5. Create pull request

### Code Style
- Use consistent indentation
- Follow React best practices
- Add comments for complex logic
- Use meaningful variable names

## Deployment

### Frontend Deployment
```bash
npm run build
```
The build folder contains the production-ready files.

### Backend Deployment
- For Node.js: Use PM2 or similar process manager
- For Django: Use Gunicorn with Nginx

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub. 