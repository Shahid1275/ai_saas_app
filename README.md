# Saas Admin App

A Saas Admin App with Backend using Postgres and Db relations with Admin, manager or user or tenant with organization.

## Requirements

- Node.js (v20.x or later)
- PostgreSQL (or your preferred SQL database)
- `npm`

## Environment Variables

Create a `.env` file in the root of backend directory. The file should contain the following variables:

### Backend (.env, .env.development, .env.production.)

```env
# Backend
DATABASE_URL=postgres://user:password@localhost:5432/yourdatabase
JWT_SECRET=your_jwt_secret
REFREESH_JWT_SECRET = your_refresh_jwt_secret
PORT=5000

NOTE: change the scripts in package.json depending upon your os to set NODE environment.

## Starting the Application

### Backend

1. Navigate to the backend directory:

   ```bash
   cd AI_Saas_Admin
   ```

  ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the database schema:

```
Copy from Seed.js and execute in your DB
install db dependencies also

4. Start the backend server:

   ```bash
   npm run start
   ```

   The backend server will be running on `http://localhost:5000` by default.


## Database Setup

Ensure you have PostgreSQL or your preferred SQL database set up. Create a database for the URL shortener application.

1. **Create Database:**

   Connect to your database and create a new database:

   ```sql
   CREATE DATABASE ai_saas_admin_app;
   ```

2. **Update `.env` File:**

   Update the `DATABASE_URL` variable in the `.env` file with your database credentials.
   
PORT=your_port
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=your_db_name
DB_PORT=5432
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_jwt_secret_key

   

```
psql -U postgres -d url_shortner -f seed.sql
```

The passwords are stored in hashed form for security. Ensure your application uses appropriate hashing methods to match this data.

```
## Features

- **User Authentication**: Secure login and signup using JSON Web Tokens (JWT).
- **Dashboard Management**: Manage, edit, and delete Tenants, organiztion and users in a responsive React-based interface.
- **Expiration Dates**: Set expiration dates for short URLs for better control.


---

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Make your changes and ensure tests pass.
4. Submit a pull request with a description of your changes.
---
