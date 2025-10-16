# PraanaCare MVP - AI-Powered Industrial Health Monitoring

PraanaCare is a comprehensive healthcare platform designed for industrial workers, featuring AI-powered health monitoring, real-time vitals tracking, and intelligent health recommendations.

## Features

### 🤖 AI-Powered Health Assistant
- Real-time health monitoring and analysis
- Intelligent symptom detection and risk assessment
- Automated emergency response and alert system
- Personalized health recommendations

### 👥 Multi-Role Support
- **Workers**: Monitor health, receive AI insights, consult doctors
- **Doctors**: Review AI-prepared cases, approve treatments, manage consultations
- **Employers**: Monitor workforce health analytics and insights

### 📊 Real-Time Analytics
- Live vitals monitoring
- Health trend analysis
- Risk factor identification
- Productivity impact assessment
- Emergency status tracking

### 🔒 Secure & Compliant
- JWT-based authentication
- Role-based access control
- HIPAA-compliant data handling
- Secure WebSocket connections

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for components
- **Framer Motion** for animations
- **Recharts** for data visualization

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose
- **Socket.io** for real-time communication
- **OpenAI API** for AI functionality
- **JWT** for authentication

## Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 5.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd praanacare-mvp
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp env.example .env
   cp backend/env.example backend/.env
   
   # Edit the environment files with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   
   # Or install MongoDB locally
   ```

5. **Run the application**
   ```bash
   # Start both frontend and backend
   npm run dev:full
   
   # Or start them separately
   npm run backend:dev  # Backend on port 5000
   npm run dev          # Frontend on port 5173
   ```

## Development

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
npm run backend:dev  # Start backend development server
npm run backend:build # Build backend
npm run backend:start # Start production backend

# Full Stack
npm run dev:full     # Start both frontend and backend
npm run build:full   # Build both frontend and backend
npm run start:full   # Start production servers
```

### Project Structure

```
praanacare-mvp/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   └── styles/           # CSS styles
├── backend/               # Backend source code
│   ├── src/
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   └── server.ts     # Main server file
│   └── package.json
├── docker-compose.yml     # Docker configuration
├── Dockerfile            # Frontend Docker config
└── README.md
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Patient Routes
- `GET /api/patient/dashboard` - Get patient dashboard
- `POST /api/patient/vitals` - Record vitals
- `GET /api/patient/vitals/history` - Get vitals history
- `GET /api/patient/alerts` - Get patient alerts

### Doctor Routes
- `GET /api/doctor/dashboard` - Get doctor dashboard
- `GET /api/doctor/patients` - Get all patients
- `GET /api/doctor/patients/:id` - Get patient details
- `PUT /api/doctor/alerts/:id/approve` - Approve treatment

### Employer Routes
- `GET /api/employer/dashboard` - Get employer dashboard
- `GET /api/employer/analytics` - Get analytics data
- `GET /api/employer/alerts` - Get active alerts
- `GET /api/employer/employees` - Get employee overview

### AI Routes
- `POST /api/ai/chat` - Send message to AI
- `GET /api/ai/chat/:id` - Get chat history
- `POST /api/ai/analyze-vitals` - Analyze vitals
- `POST /api/ai/generate-recommendations` - Generate recommendations

### Health Routes
- `GET /api/health/vitals/realtime` - Get real-time vitals
- `POST /api/health/vitals/stream` - Stream vitals data
- `GET /api/health/alerts/active` - Get active alerts
- `GET /api/health/analytics/overview` - Get health analytics

## WebSocket Events

### Client → Server
- `join-room` - Join user-specific room
- `vitals-update` - Send vitals update
- `emergency-alert` - Send emergency alert

### Server → Client
- `vitals-update` - Receive vitals update
- `emergency-alert` - Receive emergency alert
- `alert-updated` - Alert status updated
- `alert-response` - Alert response received

## Deployment

### Using Docker

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build:full
   ```

2. **Start production servers**
   ```bash
   npm run start:full
   ```

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

### Backend (backend/.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/praanacare
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
OPENAI_API_KEY=your-openai-api-key
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@praanacare.com or join our Slack channel.

## Roadmap

- [ ] Mobile app development
- [ ] Advanced AI models integration
- [ ] IoT device integration
- [ ] Telemedicine features
- [ ] Advanced analytics dashboard
- [ ] Multi-language support