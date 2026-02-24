# Pep Expense App - Backend Server

Node.js and Express-based REST API server for the Pep Expense App. Handles user authentication, group management, expense tracking, and settlement calculations.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Schemas](#database-schemas)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **User Authentication**: JWT-based authentication with Google OAuth 2.0 support
- **Group Management**: Create, update, and manage expense groups with multiple members
- **Expense Tracking**: Add, update, delete, and retrieve expenses with flexible split options
- **Smart Settlement**: Automatic calculation of who owes whom within groups
- **Role-Based Access Control**: Admin and member roles for secure group operations
- **Request Validation**: Comprehensive input validation for all API endpoints
- **Error Handling**: Centralized error handling with meaningful error messages
- **Security**: Password hashing with bcryptjs, JWT token validation, CORS enabled

## 📁 Project Structure

```
expense-server/
├── src/
│   ├── controllers/            # Request handlers & business logic
│   │   ├── authController.js
│   │   ├── groupController.js
│   │   ├── expenseController.js
│   │   └── settlementController.js
│   ├── dao/                    # Data access objects for DB operations
│   │   ├── userDao.js
│   │   ├── groupDao.js
│   │   ├── expenseDao.js
│   │   └── settlementDao.js
│   ├── model/                  # MongoDB schemas & models
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Expense.js
│   │   └── Settlement.js
│   ├── routes/                 # API route definitions
│   │   ├── authRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── expenseRoutes.js
│   │   └── settlementRoutes.js
│   ├── middlewares/            # Custom middlewares
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── corsMiddleware.js
│   ├── validators/             # Request validation schemas
│   │   ├── authValidator.js
│   │   ├── groupValidator.js
│   │   ├── expenseValidator.js
│   │   └── settlementValidator.js
│   ├── services/               # Business logic & utilities
│   │   ├── authService.js
│   │   ├── groupService.js
│   │   ├── expenseService.js
│   │   └── settlementService.js
│   ├── utility/                # Helper functions
│   │   ├── logger.js
│   │   ├── emailService.js
│   │   └── helpers.js
│   ├── config/                 # Configuration files
│   │   ├── database.js
│   │   ├── constants.js
│   │   └── config.js
│   └── server.js               # Main server entry point
├── .env.example                # Example environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🛠 Technologies

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling (ODM)
- **JWT (jsonwebtoken)** - Token-based authentication
- **Google OAuth 2.0** - Social authentication
- **Bcryptjs** - Password hashing
- **Dotenv** - Environment variable management
- **Axios** - HTTP client for external APIs
- **CORS** - Cross-Origin Resource Sharing
- **Express Validator** - Input validation middleware

## 🚀 Getting Started

### Prerequisites

- Node.js v14 or higher
- npm or yarn package manager
- MongoDB instance (local or MongoDB Atlas cloud)
- Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd expense-server

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Update .env with your configuration
# (See Environment Variables section below)

# 5. Start the server
npm start

# Server runs on http://localhost:5000
```

## ⚙️ Environment Variables

Create a `.env` file in the `expense-server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/your-expense-app
# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pep-expense-app

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_min_32_characters
JWT_EXPIRE=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login with email & password | No |
| POST | `/auth/google` | Google OAuth login | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current user profile | Yes |
| POST | `/auth/refresh-token` | Refresh JWT token | Yes |

**Register Example:**
```json
POST /auth/register
{
  "name": "kundan",
  "email": "kundan@example.com",
  "password": "SecurePassword123"
}
```

**Login Example:**
```json
POST /auth/login
{
  "email": "abc123@example.com",
  "password": "SecurePassword123"
}
```

### Group Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/groups/create` | Create new group | Yes |
| GET | `/groups` | Get all user's groups | Yes |
| GET | `/groups/:groupId` | Get group details | Yes |
| PUT | `/groups/:groupId` | Update group | Yes |
| DELETE | `/groups/:groupId` | Delete group | Yes |
| POST | `/groups/:groupId/members` | Add member to group | Yes |
| DELETE | `/groups/:groupId/members/:memberId` | Remove member | Yes |

**Create Group Example:**
```json
POST /groups/create
{
  "name": "Trip to Thailand",
  "description": "Summer vacation expenses",
  "members": ["user_id_1", "user_id_2"]
}
```

### Expense Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/expenses/create` | Create new expense | Yes |
| GET | `/expenses/group/:groupId` | Get group expenses | Yes |
| GET | `/expenses/:expenseId` | Get expense details | Yes |
| PUT | `/expenses/:expenseId` | Update expense | Yes |
| DELETE | `/expenses/:expenseId` | Delete expense | Yes |

**Create Expense Example:**
```json
POST /expenses/create
{
  "groupId": "group_id",
  "description": "Hotel booking",
  "amount": 300,
  "paidBy": "user_id_1",
  "splitType": "equal",
  "splitMembers": ["user_id_1", "user_id_2"],
  "date": "2026-02-23"
}
```

### Settlement Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/settlements/group/:groupId` | Get settlement summary | Yes |
| POST | `/settlements/settle/:groupId` | Mark settlement complete | Yes |
| GET | `/settlements/history/:groupId` | Get settlement history | Yes |

**Settlement Response Example:**
```json
GET /settlements/group/:groupId
{
  "groupId": "group_id",
  "settlements": [
    {
      "from": "user_id_1",
      "to": "user_id_2",
      "amount": 50
    }
  ],
  "totalDebt": 50
}
```

## 🗄️ Database Schemas

### User Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  googleId: String,
  profilePic: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Group Schema
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  admin: ObjectId (User reference),
  members: [ObjectId] (User references),
  createdAt: Date,
  updatedAt: Date
}
```

### Expense Schema
```javascript
{
  _id: ObjectId,
  groupId: ObjectId (Group reference),
  description: String,
  amount: Number,
  paidBy: ObjectId (User reference),
  splitType: String (equal, custom, percentage),
  splits: [
    {
      userId: ObjectId,
      amount: Number
    }
  ],
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Settlement Schema
```javascript
{
  _id: ObjectId,
  groupId: ObjectId (Group reference),
  from: ObjectId (User reference),
  to: ObjectId (User reference),
  amount: Number,
  status: String (pending, completed),
  settledAt: Date,
  createdAt: Date
}
```

## 🔒 Security Features

- **Password Hashing**: Bcryptjs with salt rounds of 10
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Express-validator for all API inputs
- **CORS**: Configured to allow requests from frontend domain only
- **Error Messages**: Generic error messages to prevent information leakage
- **Rate Limiting**: Consider implementing for production

## 📝 Available Scripts

```bash
# Start server
npm start

# Start with nodemon (development)
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Run linting and fix issues
npm run lint:fix
```

## 🐛 Error Handling

All errors return a consistent JSON format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "statusCode": 400
}
```

Common error codes:
- `INVALID_INPUT` - Validation failed
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📧 Support

For issues or questions, please open an issue on GitHub or contact the development team.