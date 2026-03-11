# Multi-Tenant Household Finance Management Platform

This repository contains the skeleton structure for the finance management platform, following a strict Laravel-style MVC architecture for both the Golang backend and the React frontend.

## Architecture Flow (MVC + Multi-Tenant Strategy)

### 1. Backend Flow (Golang)
When an API request is made (e.g., `POST /api/v1/finance/transactions`), the flow is strictly enforced as follows:

1.  **Route (`/routes`)**: Maps the HTTP endpoint to the exact Controller function.
2.  **Middleware (`/internal/middlewares`)**: 
    - Verifies the JWT.
    - Extracts the `family_id` representing the user's active tenant scope.
    - Injects `family_id` into the request context.
3.  **Controller (`/internal/controllers`)**:
    - Validates the incoming HTTP payload.
    - Extracts the `family_id` from the context.
    - Passes raw data to the Service layer.
4.  **Service (`/internal/services`)**:
    - Central place for business logic (e.g., "Is the user allowed to edit this budget?").
    - Maps DTOs into Domain Models containing the `family_id`.
    - Passes Domain Models to the Repository.
5.  **Repository (`/internal/repositories`)**:
    - **CRITICAL**: The Repository is the only layer allowed to communicate with the DB.
    - It enforces multi-tenancy by *always* appending `WHERE family_id = ?` to reads, or injecting `family_id` on inserts.
    - Works with partitioned tables natively (e.g., `transactions_2026_03`).

### 2. Frontend Flow (React Typescript)
When a user interacts with the UI (e.g., submitting a Transaction form):

1.  **View (`/src/views`)**: Page-level component handles the user click and captures form data.
2.  **Controller (`/src/controllers`)**: 
    - The View calls a function inside a Controller (e.g., `FinanceController.createTransaction(data)`).
    - The Controller handles the API logic, error boundaries, and formats responses into TypeScript Models (`/src/models`).
3.  **Service (`/src/services`)**: 
    - The Controller uses an Axios HTTP Client instance.
    - Interceptors automatically attach auth tokens.
4.  **Store (`/src/store`)**: 
    - Once the Controller completes the API call, it updates global Zustand/Redux state (e.g., adding the new transaction to the cache so the View re-renders instantly).

## Database Architecture
See `/database/schema.sql` for table definitions, partitions, and indexing rules. All transactional tables employ `PARTITION BY RANGE(date)` optimized with composite indexes spanning `family_id` and `date`.
