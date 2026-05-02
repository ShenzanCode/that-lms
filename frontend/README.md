# Library Management System - Frontend

## Description
Modern, responsive React application for Library Management System with beautiful UI/UX using Tailwind CSS and shadcn/ui components.

## Features
- 🎨 Modern UI with Tailwind CSS
- 🔐 JWT Authentication
- 📱 Fully Responsive Design
- ⚡ Fast Performance with React Query
- 🎯 Type-safe API calls with Axios
- 🔔 Toast Notifications
- 📊 Interactive Charts with Recharts
- 🎭 Beautiful Loading States
- ♿ Accessible Components

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

## Running the Application

### Development Mode
```bash
npm run dev
```

The app will run on `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```

## Project Structure
```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   └── ui/             # UI components (Button, Card, etc.)
│   ├── layouts/            # Layout components
│   ├── pages/              # Page components
│   │   ├── auth/           # Authentication pages
│   │   ├── books/          # Book management pages
│   │   ├── members/        # Member management pages
│   │   ├── transactions/   # Transaction pages
│   │   ├── reservations/   # Reservation pages
│   │   ├── fines/          # Fine management pages
│   │   ├── reports/        # Reports pages
│   │   └── settings/       # Settings pages
│   ├── services/           # API service functions
│   ├── store/              # Zustand state management
│   ├── lib/                # Utility functions and configs
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Key Technologies
- **React 19** - UI library
- **React Router v6** - Routing
- **TanStack Query (React Query)** - Data fetching and caching
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Vite** - Build tool

## Default Login Credentials
After running the backend seeder:
- **Admin**: Username: `admin`, Password: `admin123`
- **Librarian**: Username: `librarian`, Password: `lib123`

## Available Pages
- **Dashboard** - Overview with stats and quick actions
- **Books** - Manage book inventory
- **Members** - Manage library members
- **Issue Book** - Quick book issuance
- **Return Book** - Process book returns
- **Issued Books** - View all currently issued books
- **Reservations** - Manage book reservations
- **Fines** - Fine collection and management
- **Reports** - Analytics and reports
- **Settings** - System configuration

## Color Palette
- **Primary** (Indigo/Blue): #4F46E5
- **Secondary** (Purple): #8B5CF6
- **Success** (Emerald): #10B981
- **Warning** (Amber): #F59E0B
- **Danger** (Red): #EF4444

## Development Guidelines

### Component Structure
Components follow atomic design principles:
- **Atoms**: Basic UI components (Button, Input, Badge)
- **Molecules**: Composite components (SearchBar, Card with content)
- **Organisms**: Complex components (Forms, Tables, Charts)
- **Pages**: Full page layouts

### State Management
- **Local State**: useState for component-specific state
- **Global State**: Zustand for auth and shared state
- **Server State**: React Query for API data

### Styling Conventions
- Use Tailwind utility classes
- Follow consistent spacing (4px/8px grid)
- Maintain responsive design (mobile-first)
- Use custom CSS classes sparingly

## License
MIT
