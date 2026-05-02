# Library Management System - Backend API

## Description
RESTful API for Library Management System built with Node.js, Express, and MongoDB.

## Features
- 🔐 JWT Authentication
- 📚 Book Management (CRUD, Search, Bulk Import)
- 👥 Member Management (CRUD, Block/Unblock, Photo Upload)
- 📖 Issue/Return/Renew Books
- 📅 Reservation System
- 💰 Fine Management
- 📊 Comprehensive Reports & Analytics
- ⚙️ Configurable Settings

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library_management
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

4. Seed the database with initial data:
```bash
npm run seed
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://localhost:5000`

## Default Credentials (After Seeding)
- **Admin**: Username: `admin`, Password: `admin123`
- **Librarian**: Username: `librarian`, Password: `lib123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register` - Register new librarian (Admin only)

### Books
- `GET /api/books` - Get all books (with filters, pagination)
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Create book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `GET /api/books/search?q=` - Search books
- `POST /api/books/bulk-import` - Bulk import books
- `GET /api/books/categories` - Get all categories

### Members
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get single member
- `POST /api/members` - Create member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member
- `PATCH /api/members/:id/block` - Block member
- `PATCH /api/members/:id/unblock` - Unblock member
- `POST /api/members/bulk-import` - Bulk import members
- `GET /api/members/:id/history` - Get member history

### Transactions
- `POST /api/transactions/issue` - Issue book
- `POST /api/transactions/return` - Return book
- `POST /api/transactions/renew` - Renew book
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/issued` - Get currently issued books
- `GET /api/transactions/:id` - Get single transaction

### Reservations
- `GET /api/reservations` - Get all reservations
- `POST /api/reservations` - Create reservation
- `DELETE /api/reservations/:id` - Cancel reservation
- `PATCH /api/reservations/:id/notify` - Notify member
- `PATCH /api/reservations/:id/fulfill` - Mark as fulfilled

### Fines
- `GET /api/fines` - Get all fines
- `GET /api/fines/stats` - Get fine statistics
- `GET /api/fines/member/:memberId` - Get member fines
- `POST /api/fines/payment` - Record payment
- `PATCH /api/fines/:id/waive` - Waive fine

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/overdue` - Overdue books report
- `GET /api/reports/popular-books` - Popular books report
- `GET /api/reports/transactions` - Transactions report
- `GET /api/reports/member-activity` - Member activity report
- `GET /api/reports/fine-collection` - Fine collection report

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings (Admin only)

## Project Structure
```
backend/
├── controllers/       # Request handlers
├── models/           # Mongoose schemas
├── routes/           # API routes
├── middleware/       # Custom middleware
├── utils/            # Helper functions
├── scripts/          # Database scripts
├── uploads/          # Uploaded files
├── server.js         # Entry point
└── package.json
```

## Technologies Used
- **Express.js** - Web framework
- **MongoDB & Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

## Error Handling
All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Features
- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- CORS protection
- Input validation and sanitization

## License
MIT
