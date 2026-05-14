# Waffar.eg Backend API

Complete authentication and user management system for the Waffar.eg price comparison platform.

## 🚀 Features

- ✅ User registration with email validation
- ✅ Secure login with JWT authentication
- ✅ Password hashing with bcrypt
- ✅ User profile management
- ✅ Wishlist functionality
- ✅ MongoDB integration
- ✅ CORS enabled
- ✅ Error handling & validation
- ✅ Production-ready

## 📋 Requirements

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🔧 Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/waffar
JWT_SECRET=your-super-secure-key-here
```

### 3. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string and add to `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waffar
```

### 4. Start the Server

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

Expected output:
```
✓ MongoDB connected
🚀 Server running on http://localhost:5000
📝 Signup: POST /api/auth/signup
🔐 Login: POST /api/auth/login
👤 Profile: GET /api/auth/me
```

## 📚 API Endpoints

### Authentication

#### **Signup**
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "phone": "+20123456789",
  "country": "Egypt"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully!",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+20123456789",
    "country": "Egypt"
  }
}
```

---

#### **Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged in successfully!",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

#### **Get Current User** ⚠️ *Requires Authentication*
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "wishlist": ["product1", "product2"]
  }
}
```

---

#### **Update Profile** ⚠️ *Requires Authentication*
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "+20987654321",
  "country": "UAE"
}
```

---

#### **Add to Wishlist** ⚠️ *Requires Authentication*
```http
POST /api/auth/wishlist
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product123"
}
```

---

#### **Remove from Wishlist** ⚠️ *Requires Authentication*
```http
DELETE /api/auth/wishlist/:productId
Authorization: Bearer <token>
```

---

#### **Health Check**
```http
GET /api/health
```

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

## 🧪 Testing with cURL

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📦 Project Structure

```
backend/
├── server.js           # Main server file with all routes
├── package.json        # Dependencies
├── .env.example        # Environment variables template
├── .env                # Actual environment variables (create this)
└── README.md          # This file
```

## 🛡️ Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT token expiration (default 7 days)
- ✅ Email validation
- ✅ CORS protection
- ✅ Input validation
- ✅ Duplicate email prevention
- ✅ Secure token verification

## 🚀 Deployment

### Heroku
```bash
heroku login
heroku create waffar-backend
git push heroku main
heroku config:set JWT_SECRET=your-secret-key
```

### AWS/DigitalOcean/Other
1. Install Node.js on server
2. Clone repository
3. Install dependencies: `npm install`
4. Create `.env` file
5. Start with PM2: `npm install -g pm2 && pm2 start server.js`

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running locally OR MongoDB Atlas credentials are correct
- Check `MONGODB_URI` in `.env`

**CORS Error:**
- Add your frontend URL to `CORS_ORIGIN` in `.env`

**JWT Token Issues:**
- Ensure token format: `Bearer <token>` in Authorization header
- Token might be expired - generate a new one by logging in

**Port Already in Use:**
```bash
# Change PORT in .env or
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## 📝 License

MIT

## 👨‍💻 Support

For issues and questions, check the main README or contact support.
