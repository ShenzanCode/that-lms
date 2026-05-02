# 🚀 Quick Start Guide - Library Management System

## Step-by-Step Setup (5 minutes)

### Step 1: Install MongoDB
If you don't have MongoDB installed:
- **Windows**: Download from https://www.mongodb.com/try/download/community
- **Mac**: `brew install mongodb-community`
- **Linux**: `sudo apt-get install mongodb`

Start MongoDB:
```bash
# Windows (as service - automatically starts)
# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Step 2: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux

# Seed database with sample data
npm run seed

# Start backend server
npm run dev
```

✅ Backend should now be running on http://localhost:5000

### Step 3: Setup Frontend

Open a **new terminal window**:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux

# Start frontend development server
npm run dev
```

✅ Frontend should now be running on http://localhost:3000

### Step 4: Login & Explore

1. Open your browser and go to http://localhost:3000
2. Login with demo credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Explore the dashboard!

## 🎯 What's Included

### Sample Data Created by Seeder:
- ✅ 2 Librarian accounts (admin and librarian)
- ✅ 5 Sample books across different categories
- ✅ 4 Sample members (students, faculty, staff)
- ✅ Default system settings
- ✅ Configured fine rates and loan periods

## 📱 Core Features to Try

1. **Dashboard** - View statistics and recent activity
2. **Books** - Browse, search, add new books
3. **Members** - View members, add new members
4. **Issue Book** - Try issuing a book to a member
5. **Return Book** - Process a book return
6. **Reports** - View analytics and reports

## 🛠️ Troubleshooting

### Backend won't start?
```bash
# Make sure MongoDB is running
mongosh  # If this connects, MongoDB is running

# Check if port 5000 is available
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux
```

### Frontend won't start?
```bash
# Make sure backend is running first
# Check if port 3000 is available
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux
```

### "Cannot connect to database" error?
- Ensure MongoDB is running
- Check MONGODB_URI in backend/.env file
- Default: `mongodb://localhost:27017/library_management`

### API calls failing?
- Ensure backend is running on port 5000
- Check VITE_API_URL in frontend/.env file
- Should be: `http://localhost:5000/api`

## 📚 Next Steps

### For Development:
1. **Customize Settings**: Go to Settings page to configure loan periods, fine rates
2. **Add Real Data**: Start adding your library's actual books and members
3. **Explore API**: Check backend/README.md for complete API documentation
4. **Modify UI**: Frontend uses Tailwind CSS - easy to customize

### For Production:
1. Change JWT_SECRET in backend/.env to a strong random string
2. Set up production MongoDB (MongoDB Atlas recommended)
3. Build frontend: `npm run build`
4. Deploy backend (Heroku, DigitalOcean, AWS)
5. Deploy frontend (Vercel, Netlify)

## 🎓 Learn More

- **Backend Documentation**: See `backend/README.md`
- **Frontend Documentation**: See `frontend/README.md`
- **Main Documentation**: See `README.md`

## 💡 Tips

- Use Postman or Insomnia to test API endpoints
- Check browser console for frontend errors
- Check terminal for backend errors
- MongoDB Compass is great for viewing database

## 🔐 Default Accounts

After running `npm run seed`:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Librarian | librarian | lib123 |

⚠️ **Important**: Change these credentials in production!

## 🆘 Need Help?

1. Check the error message carefully
2. Ensure all dependencies are installed
3. Verify environment variables are set
4. Check if required services (MongoDB) are running
5. Clear node_modules and reinstall if needed:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📊 System Requirements

- **Node.js**: v18 or higher
- **MongoDB**: v4.4 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 500MB for application + database
- **Browser**: Chrome, Firefox, Safari, Edge (latest versions)

---

**Happy Library Managing! 📚**

For detailed documentation, see the main README.md file.
