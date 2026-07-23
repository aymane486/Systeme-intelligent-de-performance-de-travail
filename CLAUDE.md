# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

INTELLCAP is a work monitoring and performance solution ("Clé Digitale Virtuelle"). Collaborators activate/deactivate a virtual key to declare work on a project/task. Only project-level data is collected (project name, task, % progress, time spent, status, comments) — no personal content is ever captured.

## Architecture

- **Backend**: Spring Boot 3.x (Java 17+), REST API, Spring Security with JWT, Spring Data JPA, PostgreSQL
- **Frontend**: React 18+ with TypeScript, Vite, React Router, Axios
- **Structure**: Monorepo with `backend/` and `frontend/` directories

### Backend (`backend/`)

Standard Spring Boot layered architecture:
- `controller/` — REST endpoints
- `service/` — business logic
- `repository/` — JPA repositories
- `model/` — JPA entities
- `dto/` — request/response DTOs
- `config/` — Spring config (Security, CORS, WebSocket)
- `security/` — JWT filter, auth provider

### Frontend (`frontend/`)

- `src/pages/` — route-level components (CollaboratorDashboard, RTDashboard, DirectionDashboard, Admin)
- `src/components/` — reusable UI components
- `src/services/` — API client modules (Axios)
- `src/context/` — React context providers (Auth, Theme)
- `src/types/` — TypeScript interfaces

## Build & Run Commands

### Backend
```bash
cd backend
./mvnw spring-boot:run          # run dev server (port 8080)
./mvnw test                      # run all tests
./mvnw test -Dtest=ClassName     # run single test class
./mvnw test -Dtest=ClassName#methodName  # run single test method
./mvnw package -DskipTests       # build JAR without tests
```

### Frontend
```bash
cd frontend
npm install                      # install dependencies
npm run dev                      # run dev server (port 5173)
npm run build                    # production build
npm run lint                     # ESLint
npm test                         # run tests
```

## Key Domain Concepts

- **Clé Digitale (Virtual Key)**: The core mechanism — a collaborator activates it to start tracking time on a task, deactivates it to stop. No tracking occurs when inactive.
- **Three user roles**: COLLABORATEUR (activates key, declares progress), RESPONSABLE_TECHNIQUE (sees their teams only), DIRECTION (sees all projects portfolio)
- **TimeEntry**: Records each activation/deactivation session with project, task, duration
- **Privacy by design**: The system technically cannot access PC content. Only project metadata flows through the API.

## API Conventions

- All endpoints prefixed with `/api/v1/`
- Auth endpoints: `/api/v1/auth/login`, `/api/v1/auth/register`
- JWT token in `Authorization: Bearer <token>` header
- Role-based access: endpoints restricted by role via Spring Security
- Real-time updates via WebSocket (STOMP over SockJS) at `/ws`

## Database

PostgreSQL. Key tables: `users`, `projects`, `tasks`, `time_entries`, `teams`, `alerts`.
Flyway migrations in `backend/src/main/resources/db/migration/`.
