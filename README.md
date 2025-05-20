# VSA Website

A social media website for the Vietnamese Student Association (VSA) built with Node.js/Express backend and React frontend.

## Features

- User Authentication (Register/Login)
- Family/Group Management
- Social Posts System
- Points System
- Hangout Management
- Modern UI with Tailwind CSS

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS version)
- [MongoDB](https://www.mongodb.com/try/download/community)
- [Git](https://git-scm.com/downloads)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tvytran/VSAWebsite.git
   cd VSAWebsite
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   
   Create a `.env` file in the backend folder with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/vsa_website
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=24h
   PORT=5001
   ```

3. **Frontend Setup**
   ```bash
   cd ../vsa-frontend
   npm install
   ```

## Running the Application

1. **Start MongoDB**
   - Make sure MongoDB service is running on your computer
   - On Windows, you can check this in Services (services.msc)
   - Look for "MongoDB" service and ensure it's running

2. **Start Backend Server**
   ```bash
   cd backend
   node server.js
   ```
   You should see:
   - "Server running on port 5001"
   - "MongoDB Connected: localhost"

3. **Start Frontend Development Server**
   ```bash
   cd vsa-frontend
   npm start
   ```
   The application will open in your browser at http://localhost:3000

## Project Structure

```
VSAWebsite/
├── backend/                 # Backend server code
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── server.js          # Main server file
│   └── .env               # Environment variables
│
└── vsa-frontend/          # React frontend
    ├── public/            # Static files
    ├── src/              # React source code
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   └── App.js        # Main App component
    └── package.json      # Frontend dependencies
```


## Technologies Used

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB
  - Mongoose
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

Your Name - Thuy Vy Tran

Project Link: [https://github.com/tvytran/VSAWebsite](https://github.com/tvytran/VSAWebsite)