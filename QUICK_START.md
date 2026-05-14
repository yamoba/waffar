# Waffar.eg - Complete Setup & Deployment Guide

Welcome to Waffar.eg! This guide will help you set up and run the complete application locally or deploy it to production.

## 📋 Prerequisites

Before you start, make sure you have:
- **Node.js** v14+ ([Download](https://nodejs.org/))
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - recommended for cloud)
- **Git** (optional, for version control)
- **A Claude API Key** (optional, for AI features) - Get one from [Anthropic](https://console.anthropic.com/)

---

## 🚀 Quick Start (Local Development)

### Step 1: Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your settings
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Essential .env variables:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/waffar
JWT_SECRET=your-super-secret-key-change-this-in-production
NODE_ENV=development
```

### Step 3: Start Backend Server

```bash
# Option 1: Development mode (with auto-reload)
npm run dev

# Option 2: Production mode
npm start
```

You should see:
```
✓ MongoDB connected
🚀 Server running on http://localhost:5000
```

### Step 4: Open Frontend

1. Open your browser and navigate to:
   ```
   file:///path/to/your/project/index.html
   ```

2. Or use a local server (recommended):
   ```bash
   # In a new terminal, in the project root:
   python -m http.server 3000
   # or with Node:
   npx http-server -p 3000
   ```

3. Then open: `http://localhost:3000`

---

## 🤖 AI Features Setup (Claude API)

### To enable AI product search:

1. **Get Claude API Key:**
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Create an account and get your API key
   - Copy your key (looks like: `sk-ant-...`)

2. **Configure in Backend:**
   ```env
   CLAUDE_API_KEY=your-claude-api-key-here
   CLAUDE_MODEL=claude-3-5-sonnet-20241022
   ```

3. **Use in App:**
   - Go to AI Search page
   - Add your Claude API key (optional - can use backend key)
   - Start asking for product recommendations!

---

## 🧪 Testing the Application

### Create Sample Data:

1. After backend is running, visit:
   ```
   http://localhost:5000/api/demo/add-products
   ```

2. Or click "+ Demo" button in the price comparison page

### Test Accounts:

**Demo Account (for testing):**
- Email: `demo@waffar.eg`
- Password: `demo123456`

**Create Your Own:**
1. Go to Sign Up page
2. Click "🎮 Demo" button to fill sample data
3. Or manually register

---

## 📁 Project Structure

```
waffar-project/
├── index.html              # Homepage
├── login.html              # Login page
├── signup.html             # Sign up page
├── price_compare.html      # Price comparison
├── ai-search.html          # AI product search
├── dashboard.html          # User dashboard
├── assets/
│   ├── styles.css          # Shared CSS (modern design)
│   └── app.js              # Shared JavaScript utilities
├── backend/
│   ├── server.js           # Main server file
│   ├── config.js           # Configuration
│   ├── package.json        # Dependencies
│   ├── .env                # Environment variables (create from .env.example)
│   ├── models/
│   │   ├── Product.js      # Product schema
│   │   ├── Comparison.js   # Price comparison schema
│   │   └── AISearch.js     # AI search schema
│   └── .env.example        # Example env file
├── QUICK_START.md          # This file
└── README.md               # Project info
```

---

## 🔧 Available API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/wishlist` - Add to wishlist
- `DELETE /api/auth/wishlist/:productId` - Remove from wishlist

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (authenticated)

### Price Comparisons
- `GET /api/comparisons` - Get user's comparisons
- `POST /api/comparisons` - Create new comparison
- `DELETE /api/comparisons/:id` - Delete comparison

### AI Search
- `POST /api/ai-search` - Search with AI
- `GET /api/ai-search-history` - Get search history
- `POST /api/auth/claude-key` - Store Claude API key

### Demo
- `POST /api/demo/add-products` - Add sample products
- `GET /api/health` - Check server status

---

## 🌐 Deployment Options

### Option 1: Heroku (Free tier available)

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret_key
heroku config:set CLAUDE_API_KEY=your_claude_key

# Deploy
git push heroku main
```

### Option 2: Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 3: DigitalOcean (Full Stack)

1. Create a droplet with Node.js
2. Install MongoDB
3. Clone repository
4. Follow local setup steps
5. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name waffar
   pm2 save
   ```

---

## 🔐 Security Checklist

Before going live:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS (get SSL certificate)
- [ ] Set `NODE_ENV=production`
- [ ] Enable CORS only for your domain
- [ ] Add rate limiting
- [ ] Implement input validation
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB backups
- [ ] Set up error logging (e.g., Sentry)

---

## 🐛 Troubleshooting

### MongoDB Connection Error
**Problem:** `MongooseError: MongoDB connection error`

**Solution:**
```bash
# Check if MongoDB is running
# Linux/Mac:
brew services list

# Windows: Check Services app
# Or use MongoDB Atlas (cloud)
```

### Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Kill process using port 5000
# Linux/Mac:
lsof -i :5000
kill -9 <PID>

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### CORS Errors
**Problem:** Cross-origin request errors in browser console

**Solution:**
Ensure backend is running with CORS enabled. Check that your API calls use the correct base URL.

### Frontend Files Not Loading
**Problem:** CSS and JS files showing 404

**Solution:**
Make sure to serve files from a proper HTTP server, not `file://` protocol.

---

## 📚 Features Overview

### ✅ Completed Features
- Modern responsive design
- User authentication (login/signup)
- Product database and search
- Price comparison from multiple stores
- User dashboard with statistics
- Wishlist management
- AI-powered product search
- Search history
- Demo products for testing

### 🔄 Coming Soon
- Email notifications for price drops
- Two-factor authentication
- Product reviews and ratings
- Mobile app
- Real-time price updates
- Browser extensions
- API documentation (Swagger)

---

## 📞 Support & Contact

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation in code comments
3. Check MongoDB connection settings
4. Verify all environment variables are set

---

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

---

## 🎉 You're All Set!

Congratulations! Your Waffar.eg platform is now running. Start by:

1. Creating an account or using the demo account
2. Loading sample products
3. Exploring the price comparison features
4. Testing the AI search (if Claude API key is configured)
5. Adding products to your wishlist
6. Checking your dashboard

Happy price comparing! 🛍️💰
# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Install dependencies
npm install

# Run tests (if configured)
npm test
```

### MongoDB Commands
```bash
# Start MongoDB locally
mongod

# Connect to MongoDB shell
mongo

# Use waffar database
use waffar

# Find all users
db.users.find()

# Clear all users
db.users.deleteMany({})
```

---

## 🧪 Testing Signup/Login

### Using cURL (Command Line)

**Test Signup:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "country": "Egypt"
  }'
```

**Test Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Test Protected Route (Get Profile):**
```bash
# Copy the token from login response
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman
1. Download Postman from postman.com
2. Create a new request
3. Set URL: `http://localhost:5000/api/auth/signup`
4. Set Method: POST
5. Go to Body → JSON
6. Paste test data and click Send

---

## 🔐 Environment Variables

Create `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/waffar

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5000
```

**To generate JWT_SECRET:**

Windows PowerShell:
```powershell
[System.Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

Mac/Linux:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🐛 Debugging

### Check Backend Connection
```bash
# Test API health
curl http://localhost:5000/api/health
```

### View Browser Console Errors
1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for error messages

### View Backend Logs
Backend terminal shows:
- MongoDB connection status
- API requests
- Error messages

### Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot GET /" | Check file paths, ensure HTML files are in correct location |
| MongoDB connection error | Ensure MongoDB is running with `mongod` |
| "Port 5000 in use" | Change PORT in .env or kill process: `netstat -ano \| findstr :5000` |
| CORS error | Update CORS_ORIGIN in .env to include your frontend URL |
| Token expired | Clear localStorage: `localStorage.clear()` |

---

## 📊 Database Structure

### Users Collection
```javascript
{
  _id: ObjectId(),
  name: "John Doe",
  email: "john@example.com",
  password: "hashed_password",
  phone: "+20123456789",
  country: "Egypt",
  avatar: null,
  wishlist: ["product1", "product2"],
  isEmailVerified: false,
  createdAt: 2024-01-01T00:00:00.000Z,
  updatedAt: 2024-01-01T00:00:00.000Z
}
```

---

## 🚀 Deploying Backend

### Option 1: Heroku (Free)
```bash
# Install Heroku CLI
heroku login

# Create app
heroku create waffar-backend

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGODB_URI=your-mongodb-uri

# Deploy
git push heroku main
```

### Option 2: Railway.app
1. Connect GitHub repo
2. Add MongoDB plugin
3. Set environment variables
4. Deploy

### Option 3: DigitalOcean/AWS
1. Create a droplet/instance with Node.js
2. Clone repository
3. Run `npm install`
4. Create `.env` file
5. Use PM2 to keep app running:
   ```bash
   npm install -g pm2
   pm2 start server.js
   ```

---

## 🌐 Deploying Frontend

### Option 1: Netlify (Recommended)
1. Go to netlify.com
2. Drag and drop your HTML files
3. Update API_URL in HTML to deployed backend

### Option 2: GitHub Pages
1. Create GitHub repo
2. Upload HTML files
3. Enable GitHub Pages in settings
4. Share the generated URL

### Option 3: Traditional Hosting
1. FTP to hosting provider
2. Upload HTML files
3. Update API_URL in HTML

---

## 📱 Testing Wishlist

```javascript
// Add to wishlist
fetch('http://localhost:5000/api/auth/wishlist', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: 'samsung-galaxy-a52'
  })
})

// Remove from wishlist
fetch('http://localhost:5000/api/auth/wishlist/samsung-galaxy-a52', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## 💡 Tips & Tricks

1. **Auto-reload Backend:** Use `npm run dev` instead of `npm start`
2. **Clear Cache:** Hard refresh browser with Ctrl+Shift+R (Cmd+Shift+R on Mac)
3. **Test Locally:** Use localhost, not IP address
4. **Check Logs:** Always check backend terminal for errors
5. **Verify Token:** Decode JWT at jwt.io to check token contents

---

## 📞 Getting Help

1. Check backend logs (terminal output)
2. Check browser console (F12 → Console)
3. Verify MongoDB is running
4. Verify all files are in correct locations
5. Check .env configuration
6. Test API endpoints with curl or Postman

---

**Happy Coding! 🎯**
