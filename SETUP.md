# Management System Setup

## Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (cloud database)
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory with:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/takshagamanage?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

3. **MongoDB Atlas Setup:**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Get your connection string
   - Replace `username`, `password`, and `cluster` in the URI above
   - Make sure to add your IP address to the whitelist

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Test the database connection:**
   Visit `http://localhost:3000/api/test-db` to verify the connection

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Dashboard
- `GET /api/dashboard` - Protected dashboard data

### Testing
- `GET /api/test-db` - Test database connection

## Features
- ✅ User authentication with JWT
- ✅ Password hashing with bcrypt
- ✅ MongoDB Atlas integration
- ✅ Protected API routes
- ✅ Clean login form
- ✅ TypeScript support
- ✅ Tailwind CSS styling

## Project Structure
```
app/
├── api/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   └── test-db/
├── components/
│   └── LoginForm.tsx
├── lib/
│   ├── auth.ts
│   └── db.ts
├── models/
│   └── User.ts
├── types/
├── utils/
└── page.tsx
```

## Next Steps
1. Add more API endpoints for CRUD operations
2. Implement user management features
3. Add role-based access control
4. Create dashboard components
5. Add form validation
6. Implement error handling
7. Add testing 