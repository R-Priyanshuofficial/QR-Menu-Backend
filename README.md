# QR Menu Backend API

Backend API for QR Menu Restaurant Application built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your configuration
# Add your MongoDB URI and JWT Secret

# Start development server
npm run dev

# Start production server
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Auth logic
│   │   ├── dashboardController.js
│   │   └── qrController.js      # QR code logic
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Error handling
│   │   └── validator.js         # Input validation
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── QRCode.js            # QR code schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── qrRoutes.js
│   └── utils/
│       ├── ApiError.js          # Custom error class
│       └── generateToken.js     # JWT token generator
├── .env.example
├── .gitignore
├── package.json
├── server.js                     # Entry point
└── README.md
```

## 🔌 API Endpoints

See `API_DOCUMENTATION.md` for detailed endpoint documentation.

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **QRCode** - QR code generation
- **express-validator** - Input validation

## 🔐 Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/qr-menu
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

## 🧪 Testing

Use Postman or any API client to test the endpoints. Import the collection from `API_DOCUMENTATION.md`.

## 📝 License

ISC
