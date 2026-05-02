# 📚 Library Management System

A complete, production-ready **MERN Stack** application for managing university libraries. This system provides librarians with powerful tools to manage books, members, transactions, fines, reservations, and generate comprehensive reports.

![Tech Stack](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based secure authentication
- Role-based access control (Admin & Librarian)
- Protected routes and API endpoints
- Session management

### 📖 Book Management
- Complete CRUD operations
- Advanced search and filtering
- Multiple copy tracking
- Bulk import from Excel/CSV
- Category management
- Book status tracking (Available, Issued, Damaged, Lost)
- Barcode support

### 👥 Member Management
- Student, Faculty, and Staff member types
- Photo upload and management
- Member profiles with borrowing history
- Block/Unblock functionality
- Borrowing limits per member type
- Membership validity tracking
- Bulk import capability

### 📚 Circulation (Issue/Return)
- Quick issue interface
- Book return with automatic fine calculation
- Renew books (up to 2 times)
- Due date calculation based on member type
- Real-time availability checking
- Transaction history

### 📅 Reservation System
- Queue-based reservation system
- Automatic notifications when books become available
- Priority management
- Reservation expiry tracking

### 💰 Fine Management
- Automatic fine calculation for overdue books
- Payment tracking and receipt generation
- Fine waiver with authorization
- Payment methods support
- Outstanding fines reports

### 📊 Reports & Analytics
- Dashboard with key statistics
- Overdue books report
- Popular books and categories
- Member activity reports
- Fine collection reports
- Transaction reports with date filters
- Borrowing trends visualization
- Export to PDF/Excel

### ⚙️ System Settings
- Configurable loan periods
- Borrowing limits per member type
- Fine rates and maximum limits
- Renewal settings
- Holiday management
- Library information

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

### Frontend
- **React 19** - UI library (JavaScript, no TypeScript)
- **React Router v6** - Navigation
- **TanStack Query (React Query)** - Data fetching & caching
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Vite** - Build tool

## 📁 Project Structure

```
Library_Managment_System/
├── backend/
│   ├── controllers/       # Request handlers
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Helper functions
│   ├── scripts/          # Database scripts
│   ├── uploads/          # Uploaded files
│   ├── server.js         # Entry point
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── layouts/      # Layout components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── store/        # State management
│   │   ├── lib/          # Utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   └── README.md
│
└── README.md (this file)
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Library_Managment_System
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library_management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

3. **Setup Frontend**
```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Seed Database** (Optional but recommended)
```bash
cd ../backend
npm run seed
```

This creates:
- Admin user (username: `admin`, password: `admin123`)
- Librarian user (username: `librarian`, password: `lib123`)
- Sample books and members
- Default settings

### Running the Application

**Backend:**
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:5000`

**Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:3000`

## 📖 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Main Endpoints

#### Auth
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout
- `POST /auth/register` - Register librarian (Admin only)

#### Books
- `GET /books` - Get all books (with pagination & filters)
- `GET /books/:id` - Get book details
- `POST /books` - Create book
- `PUT /books/:id` - Update book
- `DELETE /books/:id` - Delete book
- `GET /books/search?q=` - Search books
- `POST /books/bulk-import` - Bulk import

#### Members
- `GET /members` - Get all members
- `GET /members/:id` - Get member details
- `POST /members` - Create member
- `PUT /members/:id` - Update member
- `DELETE /members/:id` - Delete member
- `PATCH /members/:id/block` - Block member
- `PATCH /members/:id/unblock` - Unblock member

#### Transactions
- `POST /transactions/issue` - Issue book
- `POST /transactions/return` - Return book
- `POST /transactions/renew` - Renew book
- `GET /transactions` - Get all transactions
- `GET /transactions/issued` - Get issued books

#### Reservations
- `GET /reservations` - Get all reservations
- `POST /reservations` - Create reservation
- `DELETE /reservations/:id` - Cancel reservation

#### Fines
- `GET /fines` - Get all fines
- `GET /fines/member/:memberId` - Get member fines
- `POST /fines/payment` - Record payment
- `PATCH /fines/:id/waive` - Waive fine

#### Reports
- `GET /reports/dashboard` - Dashboard statistics
- `GET /reports/overdue` - Overdue books
- `GET /reports/popular-books` - Popular books
- `GET /reports/transactions` - Transactions report

#### Settings
- `GET /settings` - Get settings
- `PUT /settings` - Update settings (Admin only)

## 🎨 UI/UX Features

### Design System
- **Primary Color**: Indigo (#4F46E5) - Main actions
- **Secondary Color**: Purple (#8B5CF6) - Accents
- **Success**: Emerald (#10B981) - Success states
- **Warning**: Amber (#F59E0B) - Warnings
- **Danger**: Red (#EF4444) - Errors/overdue

### Modern UI Components
- Clean, minimalist interface
- Card-based layouts
- Smooth transitions
- Responsive design (mobile, tablet, desktop)
- Loading skeletons
- Toast notifications
- Modal dialogs
- Data tables with sorting/filtering
- Interactive charts and graphs
- Empty states with actions
- Form validation with error messages

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Helmet security headers
- CORS protection
- Input validation and sanitization
- XSS protection
- SQL injection prevention
- Secure file uploads

## 📝 Database Schema

### Collections
- **Librarians** - System users
- **Books** - Book inventory
- **Members** - Library members
- **Transactions** - Issue/return records
- **Reservations** - Book reservations
- **Fines** - Fine records
- **Settings** - System configuration

## 🧪 Testing

The application includes comprehensive error handling and validation at both client and server levels.

## 📦 Deployment

### Backend Deployment (Example: Heroku)
```bash
cd backend
heroku create your-app-name
git push heroku main
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-secret
```

### Frontend Deployment (Example: Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

### Environment Variables for Production
Make sure to set all required environment variables in your hosting platform.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer Notes

### Development Workflow
1. Always test API endpoints using tools like Postman
2. Follow RESTful conventions
3. Write meaningful commit messages
4. Keep components small and reusable
5. Use proper error handling

### Code Style
- Backend: ESLint with Airbnb style guide
- Frontend: ESLint with React hooks rules
- Use Prettier for code formatting

## 🙏 Acknowledgments

- shadcn/ui for component design inspiration
- Tailwind CSS for utility-first styling
- React Query for efficient data fetching
- MongoDB for flexible data modeling

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

**Built with ❤️ using the MERN Stack**
