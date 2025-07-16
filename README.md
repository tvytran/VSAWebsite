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
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
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
REACT_APP_API_BASE_URL=http://localhost:5001
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
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

## Vercel Deployment

### Environment Variables Setup

To deploy to Vercel, you need to set the following environment variables in your Vercel project settings:

#### Backend Environment Variables (in Vercel Dashboard):
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase service role key
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (same as SUPABASE_KEY)
- `SUPABASE_BUCKET`: Your Supabase storage bucket name
- `JWT_SECRET`: A secure random string for JWT token signing
- `NODE_ENV`: Set to "production"

#### Frontend Environment Variables (in Vercel Dashboard):
- `REACT_APP_SUPABASE_URL`: Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Deployment Steps:

1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel dashboard
3. Deploy - Vercel will automatically build both frontend and backend
4. The API will be available at `/api/*` endpoints
5. The frontend will be served from the root domain

### Troubleshooting Vercel Deployment:

If you encounter network errors or posts/announcements not showing:

1. **Check Environment Variables**: Ensure all required environment variables are set in Vercel
2. **Check CORS**: The backend is configured to allow requests from Vercel domains
3. **Check API Routes**: Ensure your API calls use relative URLs (`/api/*`) in production
4. **Check Vercel Logs**: Look at the function logs in Vercel dashboard for any errors

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