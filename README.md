# Contact Information System

A containerized contact management system that allows users to view, add, edit, and manage contact information through a web interface.

## Project Overview

The Contact Information System is a web-based application built using a multi-container architecture. The system separates the frontend, contact API, validation service, database, and reverse proxy into different containers.

All application traffic enters through the Nginx reverse proxy on port 8080.

## Features

- View contact information
- Add new contacts
- Edit existing contacts
- Delete contacts
- Validate phone numbers and email addresses
- Search and manage contact records
- Persistent database storage
- Automated testing through Jenkins
- Docker-based deployment
- CI/CD pipeline with build, test, deploy, and smoke-test stages

## System Components

| Container | Role | Technology |
|---|---|---|
| `proxy` | Main entry point and reverse proxy | Nginx |
| `frontend` | User interface and contact management pages | React + Vite |
| `service-a` | Contacts API and database operations | Node.js + Express |
| `service-b` | Phone and email validation service | Node.js + Express |
| `db` | Stores contact information | MySQL 8 |

Only the `proxy` container publishes a host port.

### Routes

| Route | Purpose |
|---|---|
| `/` | Frontend application |
| `/api/contacts/` | Contact management API |
| `/api/validate/` | Validation API |

## Technologies Used

- React
- Vite
- Node.js
- Express
- MySQL 8
- Nginx
- Docker
- Docker Compose
- Jenkins
- GitHub

## Running the Application

### 1. Clone the repository

```bash
git clone https://github.com/nicwnk/Contact-Information-System.git
cd Contact-Information-System