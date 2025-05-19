# VSA Website

A social media website for the Vietnamese Student Association (VSA) built with Node.js/Express and MongoDB.

## Database Models

### User Model
- Authentication and profile management
- Points tracking (total and semester)
- Family association and role management
- Profile picture support

### Family Model
- Family management with name and description
- Member tracking
- Points system (total and semester)

### Post Model
- Unified model for posts and hangouts
- Type-based distinction ('post' vs 'hangout')
- Hangout features: date, location, attendance tracking
- Like and comment functionality
- Family-based organization

### PointsHistory Model
- Track points transactions
- Support for different point types
- Link points to specific posts/hangouts
- Audit trail with authorization tracking

## Features
- User authentication and management
- Family-based organization
- Posts and hangouts system
- Points tracking and rewards
- Attendance management

## Tech Stack
- Backend: Node.js/Express
- Database: MongoDB
- Authentication: JWT (coming soon)
- Frontend: React (coming soon)