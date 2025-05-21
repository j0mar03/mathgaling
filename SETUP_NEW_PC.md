# Plan: Replicate Development Setup on a New PC

This plan outlines the steps to set up the ITS-KIDS development environment on a new computer, assuming the new PC might be on a different network than the original one. It uses Docker Compose to run the database and relies on database seeders for initial data.

## 1. Prerequisites on New PC

Ensure the following software is installed on your new machine:

*   **Git:** For cloning the project repository. ([Download Git](https://git-scm.com/downloads))
*   **Node.js & npm:** Required for running the application server and client. Check your project's `package.json` or documentation for any specific version requirements. ([Download Node.js](https://nodejs.org/))
*   **Docker Desktop:** For running the PostgreSQL database container. Download and install it, then ensure the Docker engine is running. ([Download Docker Desktop](https://www.docker.com/products/docker-desktop/))

## 2. Get Project Code

Choose one method:

*   **(Recommended) Clone using Git:**
    ```bash
    # Replace <your_repository_url> with the actual URL of your Git repository
    git clone <your_repository_url> ITS-KIDS-main
    cd ITS-KIDS-main
    ```
*   **Manual Copy:**
    *   Copy the entire `ITS-KIDS-main` project folder from your old PC to the new PC (e.g., via USB drive, network share).
    *   Open a terminal/command prompt and navigate into the copied `ITS-KIDS-main` directory.

## 3. Start Database Container

The project uses Docker Compose to manage the database service.

*   Navigate to the server directory:
    ```bash
    cd client/server
    ```
*   Start the services (including the PostgreSQL database) defined in `docker-compose.yml` in detached mode (runs in the background):
    ```bash
    docker compose up -d
    ```
    *   *Troubleshooting:* If this command fails, try the older syntax: `docker-compose up -d`.
    *   This will download the PostgreSQL image if needed and start the container.

## 4. Verify Environment Configuration

*   Ensure the `client/server/.env` file exists (it should have been cloned or copied).
*   Verify that the database connection variables match what the `docker-compose.yml` file expects and exposes. The defaults are usually correct:
    ```ini
    DEV_DB_USERNAME=postgres
    DEV_DB_PASSWORD=password
    DEV_DB_NAME=its_kids_dev
    DEV_DB_HOST=127.0.0.1
    DEV_DB_PORT=5432
    ```

## 5. Install Project Dependencies

Install Node.js packages for both the main project and the client application.

*   Navigate to the project root directory:
    ```bash
    # If you are in client/server:
    cd ../..
    # Or navigate directly: cd /path/to/ITS-KIDS-main
    ```
*   Install root dependencies:
    ```bash
    npm install
    ```
*   Navigate to the client directory:
    ```bash
    cd client
    ```
*   Install client dependencies:
    ```bash
    npm install
    ```

## 6. Run Database Seeders

Populate the newly created database with initial sample data using Sequelize seeders.

*   Navigate back to the server directory:
    ```bash
    # If you are in client:
    cd ../server
    # Or navigate directly: cd /path/to/ITS-KIDS-main/client/server
    ```
*   Execute the Sequelize CLI command to run all seeders:
    ```bash
    npx sequelize-cli db:seed:all
    ```
    *   *Note:* This assumes `sequelize-cli` is available (usually installed as a dev dependency). If this command fails, check the `scripts` section in `package.json` (in the root or `client/server` directory) for a specific seeding script.

## 7. Run Application

Start the development server and client application.

*   Navigate to the project root directory:
    ```bash
    # If you are in client/server:
    cd ../..
    # Or navigate directly: cd /path/to/ITS-KIDS-main
    ```
*   Run the development start script (check your root `package.json` for the exact script name, often `dev` or `start`):
    ```bash
    npm run dev
    ```
    *   This command likely uses `concurrently` to start both the backend server and the frontend client development server.

Your development environment should now be running on the new PC, connected to its own local Dockerized database instance populated with seed data.