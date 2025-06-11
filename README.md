# NoscAI Test

A comprehensive appointment management system with real-time collaborative editing, locking mechanisms, and animated cursors to prevent concurrent edits and data conflicts.

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/ericjchang/noscai-test.git
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Environment Configuration

Create `.env` file in the `backend` directory:

```
DB_HOST=192.168.1.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=noscai-test

FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_key

LOCK_EXPIRY_MINUTES=5
```

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb noscai-test //your db name

# Run migration
npm run migration:run

# Seed initial data
npm run seed
```

### 5. Start Backend Server

```bash
# Development mode
npm run dev
```

Backend will run on: `http://localhost:3001`

### 6. Frontend Setup

```bash
cd ../frontend
npm install
```

### 7. Environment Configuration

Create `.env` file in the `frontend` directory:

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

### 8. Start Frontend Application

```bash
npm start
```

Frontend will run on: `http://localhost:3000`

## Features

- **Real-time Locking System**: Prevents concurrent edits with automatic lock expiration
- **Collaborative Cursors**: Live cursor tracking with Aceternity Following Pointer animations
- **Admin Takeover**: Force release locks with admin privileges
- **Optimistic Locking**: Version-based conflict resolution
- **WebSocket Integration**: Real-time updates and notifications
- **Responsive UI**: Modern design with Tailwind CSS and Framer Motion
- **Role-based Access**: Admin and user role management
- **Auto-cleanup**: Automatic lock expiration and cleanup

## Tech Stack

### Backend

- **Node.js** with **Express** - REST API framework
- **TypeORM** - Database ORM with PostgreSQL
- **Socket.io** - WebSocket implementation
- **JWT** - Authentication and authorization
- **bcrypt** - Password hashing
- **Joi** - Request validation
- **Helmet** - Security middleware

### Frontend

- **React 19 with TypeScript** - UI framework
- **TanStack React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling framework
- **Framer Motion** - Animations
- **Aceternity UI** - Following pointer component
- **Axios** - HTTP client

### Database

- **PostgreSQL** - Primary database
- **TypeORM Migrations** - Database schema management

## Screenshot

### Login Screen

![](./Screenshot/Screenshot%20from%202025-06-11%2023-41-50.png)

### Collaborative Cursors

![](./Screenshot/Screenshot%20from%202025-06-11%2023-46-21.png)

### Force Release Lock

![](./Screenshot/Screenshot%20from%202025-06-11%2023-46-52.png)

### Show Current Editor, Lock Timer & Admin Request Control

![](./Screenshot/Screenshot%20from%202025-06-11%2023-47-29.png)
![](./Screenshot/Screenshot%20from%202025-06-11%2023-47-34.png)
