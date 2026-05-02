# Library Management System

A full-stack library management system with React frontend and Node.js backend.

## Project Structure
```
Library_Managment_System/
├── backend/          # Node.js/Express API server
├── frontend/         # React/Vite client app
├── package.json      # Root package.json for running both apps
└── README.md         # This file
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

### Installation
1. Clone the repository
2. Install all dependencies:
   ```bash
   npm run install:all
   ```

### Running the Application

#### Development Mode (Recommended)
Run both frontend and backend simultaneously:
```bash
npm run dev
```
This will start:
- Backend server on http://localhost:5000
- Frontend application on http://localhost:3002 (or next available port)

#### Individual Services
```bash
# Backend only
npm run backend:dev

# Frontend only  
npm run frontend:dev
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start both services
npm run start
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run start` | Start both in production mode |
| `npm run build` | Build frontend for production |
| `npm run backend:dev` | Start backend in development mode (nodemon) |
| `npm run backend:start` | Start backend in production mode |
| `npm run frontend:dev` | Start frontend in development mode |
| `npm run frontend:build` | Build frontend for production |
| `npm run install:all` | Install dependencies for root, backend, and frontend |
| `npm run seed` | Seed the database with initial data |

## Environment Variables

Make sure to set up your environment variables in the backend:
- Create a `.env` file in the `backend/` directory
- Add your MongoDB connection string and other required variables

## Accessing the Application

- Frontend: http://localhost:3002 (or the port shown in terminal)
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs (if available)

## Development Workflow

1. Start development servers: `npm run dev`
2. Make changes to your code
3. Both servers will auto-reload on changes
4. Frontend changes are instant with Vite hot reload
5. Backend changes restart the server with nodemon

## Troubleshooting

If you encounter port conflicts:
- Frontend will automatically find the next available port (3000, 3001, 3002, etc.)
- Backend runs on port 5000 by default
- Check for other services running on these ports

If services fail to start:
- Ensure MongoDB is running
- Check that all dependencies are installed: `npm run install:all`
- Verify environment variables in backend/.env