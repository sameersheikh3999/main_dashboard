# Educational Dashboard

A comprehensive educational management system with real-time messaging, data visualization, and multi-user role management. Built with Django backend and React frontend.

## 🚀 Features

- **Multi-User Dashboard**: Support for Principals, AEOs (Assistant Education Officers), FDEs (Federal Directorate of Education), and Admin users
- **Real-time Messaging**: WebSocket-based messaging system between different user roles
- **Data Visualization**: Interactive charts and graphs for educational data analysis
- **BigQuery Integration**: Sync and analyze educational data from Google BigQuery
- **Role-based Access Control**: Secure access management for different user types
- **Real-time Updates**: Live data updates and notifications

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Python 3.8+**
- **Node.js 16+** and npm
- **PostgreSQL** (for production) or SQLite (for development)
- **Redis** (for caching and WebSocket support)
- **Docker** and Docker Compose (optional, for containerized deployment)

## 🛠️ Installation & Setup

### Option 1: Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd main_dashboard
   ```

2. **Start all services with Docker Compose**
   ```bash
   docker-compose up --build
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Redis on port 6379
   - Django backend on port 8000
   - React frontend on port 3000

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Django Admin: http://localhost:8000/admin

### Option 2: Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env file with your configuration
   ```

5. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the Django development server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Start the React development server**
   ```bash
   npm start
   ```

### Option 3: Using the Development Script

1. **Make the script executable**
   ```bash
   chmod +x start_dev.sh
   ```

2. **Run the development script**
   ```bash
   ./start_dev.sh
   ```

   This script will automatically start both backend and frontend servers.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3  # For development
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname  # For production

# Google Cloud/BigQuery (optional)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=1
JWT_REFRESH_TOKEN_LIFETIME=7

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Redis
REDIS_URL=redis://localhost:6379/0

# Email Settings (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Database Setup

For production, it's recommended to use PostgreSQL:

1. **Install PostgreSQL**
2. **Create database**
   ```sql
   CREATE DATABASE educational_dashboard;
   CREATE USER dashboard_user WITH PASSWORD 'dashboard_password';
   GRANT ALL PRIVILEGES ON DATABASE educational_dashboard TO dashboard_user;
   ```
3. **Update DATABASE_URL in .env**

## 👥 User Roles and Access

The system supports multiple user roles:

- **Admin**: Full system access, user management
- **Principal**: School-level data access and messaging
- **AEO (Assistant Education Officer)**: District-level oversight
- **FDE (Federal Directorate of Education)**: Federal-level management

### Creating Test Users

Use the provided scripts to create test users:

```bash
# Create AEO users
python backend/create_aeo_users.py

# Create FDE users
python backend/create_fde_users.py

# Create test principals
python backend/create_test_principal.py
```

## 🚀 Running the Application

### Development Mode

1. **Start Redis** (required for WebSocket and caching)
   ```bash
   redis-server
   ```

2. **Start Backend**
   ```bash
   cd backend
   source venv/bin/activate
   python manage.py runserver 0.0.0.0:8000
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```

### Production Mode

1. **Build frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Use Docker Compose with production profile**
   ```bash
   docker-compose --profile production up --build
   ```

## 📊 Data Management

### BigQuery Integration

To sync data from Google BigQuery:

1. **Set up Google Cloud credentials**
2. **Run sync command**
   ```bash
   cd backend
   python manage.py sync_bigquery_data
   ```

### Sample Data

Populate the database with sample data:

```bash
cd backend
python manage.py populate_sample_data
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Run All Tests
```bash
# Backend tests
cd backend && python manage.py test

# Frontend tests
cd frontend && npm test
```

## 📁 Project Structure

```
main_dashboard/
├── backend/                 # Django backend
│   ├── api/                # Django apps
│   ├── main_api/           # Django settings
│   ├── requirements.txt     # Python dependencies
│   └── manage.py           # Django management
├── frontend/               # React frontend
│   ├── src/                # React source code
│   ├── public/             # Static files
│   └── package.json        # Node.js dependencies
├── docker-compose.yml      # Docker configuration
├── start_dev.sh           # Development startup script
└── README.md              # This file
```

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, 5432, and 6379 are available
2. **Database connection**: Check database credentials and connection settings
3. **Redis connection**: Ensure Redis server is running
4. **Node modules**: Run `npm install` in frontend directory
5. **Python dependencies**: Activate virtual environment and run `pip install -r requirements.txt`

### Logs

- **Backend logs**: Check `backend/logs/` directory
- **Docker logs**: `docker-compose logs [service-name]`
- **Frontend logs**: Check browser console

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Check the documentation in the project files
- Review the implementation summaries in the root directory
- Create an issue in the repository

---

**Note**: This is a development setup. For production deployment, ensure proper security configurations, environment variables, and database setup. 