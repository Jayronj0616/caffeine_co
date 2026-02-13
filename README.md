# Caffeine Co. Project

## Project Structure
- **client/**: Contains the React frontend application (Vite).
- **server/**: Contains the Express backend API and MySQL connection (Sequelize).

## How to Run

1.  **Start Services (Docker)**:
    ```bash
    docker-compose up --build
    ```
    - Website: http://localhost:5173
    - API: http://localhost:5000
    - phpMyAdmin: http://localhost:8080

1.  **Start Backend (Local Dev)**:
    ```bash
    cd server
    npm install
    node index.js
    ```
    (Runs on http://localhost:5000)

2.  **Start Frontend (Local Dev)**:
    ```bash
    cd client
    npm install
    npm run dev
    ```
    (Runs on http://localhost:3000)

## Features
- **Luxury UI**: Uses the "Artisan Cream & Espresso" color palette.
- **Database**: MySQL integration for menu items.
- **Management**: phpMyAdmin included for database management.
