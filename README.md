# VSA Website

A social media platform for the Vietnamese Student Association (VSA), built with a Node.js/Express backend, Supabase/Postgres database, and a modern React frontend.

## Features

- User Authentication (Register/Login with JWT)
- Family/Group Management
- Social Posts System (with comments, points, and profile photos)
- Points System
- Hangout/Event Management
- Modern UI with Tailwind CSS

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS version)
- [Git](https://git-scm.com/downloads)
- [Supabase](https://supabase.com/) account (for database and storage)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/tvytran/VSAWebsite.git
cd VSAWebsite
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder with the following variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=your_supabase_storage_bucket
JWT_SECRET=your_jwt_secret
PORT=5001
```

### 3. Frontend Setup

```bash
cd ../vsa-frontend
npm install
```

Create a `.env` file in the `vsa-frontend` folder with:

```
REACT_APP_API_URL=http://localhost:5001
```

## Running the Application

### 1. Start the Backend Server

```bash
cd backend
node server.js
```
You should see:  
- "Server running on port 5001"

### 2. Start the Frontend Development Server

```bash
cd vsa-frontend
npm start
```
The application will open in your browser at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
VSAWebsite/
├── backend/                 # Backend server code (Express, Supabase)
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── server.js           # Main server file
│   └── .env                # Environment variables
│
└── vsa-frontend/           # React frontend
    ├── public/             # Static files
    ├── src/                # React source code
    │   ├── components/     # React components
    │   ├── pages/          # Page components
    │   └── App.js          # Main App component
    └── package.json        # Frontend dependencies
```

## Technologies Used

- **Backend:**
  - Node.js
  - Express.js
  - Supabase (Postgres, Storage)
  - JWT Authentication
  - bcrypt

- **Frontend:**
  - React
  - Tailwind CSS
  - Axios
  - React Router

## License

This project is licensed under the ISC License.

## Contact

Thuy Vy Tran  
Project Link: [https://github.com/tvytran/VSAWebsite](https://github.com/tvytran/VSAWebsite)