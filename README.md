# CheckLit

This is the backend Express API for CheckLit.

## Group Members

Carl Michael Toribio - Backend (Handled Express and Connection to React).
Shawn Allen Rubin - Frontend (Handled React and Made UI).

Replace these placeholders with the real group details before submission.

## Project Concept

CheckLit is a shopping-list and budget-tracking application. The React frontend sends requests to this Express REST API, and the API validates and stores data in MongoDB through Mongoose.

## What the Application Does and What Data It Processes

The API manages user accounts, categories, products, and shopping lists. It calculates item subtotals and list totals, derives list status from purchased items, records purchase dates, synchronizes saved item prices when an admin changes a catalog price, and prevents deletion of categories that still have products assigned.

Data includes user names, email addresses, roles, hashed passwords, product details, categories, prices, units, list owners, list metadata, quantities, completion flags, purchase dates, budgets, notes, calculated totals, and list statuses. Passwords are hashed with bcryptjs before being stored. Authentication tokens are signed with the configured JWT secret.

## Features

- JWT-based registration and login; public registration always creates a regular user.
- Protected user profile and password-change endpoints.
- Public catalog browsing and admin-only product/category management.
- Shopping-list CRUD scoped to the authenticated owner.
- Server-side validation, calculated totals, quantity validation, and automatic statuses.
- Purchase dates set and cleared with item completion changes.
- Product-price synchronization for saved list items.
- Category rename synchronization and deletion protection.
- Seed script for an admin account, 11 starter categories, and 36 products.
- Request logger, error middleware, and JSON 404 response.

## Setup

### Requirements

- Node.js and npm
- A MongoDB database (MongoDB Atlas or local MongoDB)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and set the values:

```env
PORT=8000
MONGO_URI=mongodb_connection_string
JWT_SECRET=secret
JWT_EXPIRES_IN=1d
ADMIN_NAME=admin_name
ADMIN_EMAIL=admin_email
ADMIN_PASSWORD=admin_password
```

When the seed script creates a new admin account, `ADMIN_PASSWORD` must be 8–72 characters and include at least one uppercase letter, one lowercase letter, and one number. Replace the example values with your own. Never commit `.env`.

### 3. Seed starter data

```bash
npm run seed
```

The seed script creates the admin account if it does not exist and adds missing default categories and products. It validates the password when creating a new admin and does not overwrite the password of an existing admin account.

### 4. Run the server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Default local API base URL: `http://localhost:8000/api`.

The frontend development origin is currently configured as `http://localhost:5173` in CORS. Update the CORS configuration when using a different frontend origin.

## Screenshots / Verification Evidence

For the submission, capture real evidence from your running backend and add it to `docs/screenshots/`:

- browser or API-client response from `http://localhost:8000/`.

- response from `http://localhost:8000/api/health` while MongoDB is connected.


After adding the images, use Markdown such as `![API health response](docs/screenshots/02-api-health.png)` below this section.

## API Documentation

For protected endpoints, send `Authorization: Bearer <token>`. Example IDs below are placeholders; use IDs returned by the API. Requests use JSON.

### Health and Authentication

| Method | Path | Purpose | Sample request | Sample response |
|---|---|---|---|---|
| GET | `/` | Check whether Express is running | None | `{"message":"CheckLit API is running!","status":"success"}` |

| GET | `/api/health` | Check server and database status | None | `{"server":"running","database":"connected"}` |

| POST | `/api/auth/register` | Create a regular user | `{"name":"Alex User","email":"alex@example.com","password":"SecurePass123"}` | `{"message":"Registration successful.","token":"<jwt>","user":{"id":"<id>","name":"Alex User","email":"alex@example.com","role":"user"}}` |

| POST | `/api/auth/login` | Authenticate and return a JWT | `{"email":"alex@example.com","password":"SecurePass123"}` | `{"message":"Login successful.","token":"<jwt>","user":{"id":"<id>","name":"Alex User","email":"alex@example.com","role":"user"}}` |

### Profile

| Method | Path | Purpose | Sample request | Sample response |
|---|---|---|---|---|
| GET | `/api/profile` | Get the authenticated user's profile | Bearer token; no body | `{"id":"<id>","name":"Alex User","email":"alex@example.com","role":"user","createdAt":"<date>","updatedAt":"<date>"}` |

| PUT | `/api/profile` | Update the user's display name | `{"name":"Alex U."}` | `{"message":"Profile updated successfully.","user":{"id":"<id>","name":"Alex U.","email":"alex@example.com","role":"user"}}` |

| PATCH | `/api/profile/password` | Change the user's password | `{"currentPassword":"OldPass123","newPassword":"NewPass456"}` | `{"message":"Password changed successfully."}` |

### Categories

| Method | Path | Purpose | Sample request | Sample response |
|---|---|---|---|---|
| GET | `/api/categories` | List all categories | None | `[{"_id":"<id>","name":"Vegetables","description":"Fresh vegetables and greens"}]` |

| GET | `/api/categories/:id` | Get one category | None | `{"_id":"<id>","name":"Vegetables","description":"Fresh vegetables and greens"}` |

| POST | `/api/categories` | Admin creates a category | `{"name":"Frozen Foods","description":"Frozen groceries"}` | `{"_id":"<id>","name":"Frozen Foods","description":"Frozen groceries"}` |

| PUT | `/api/categories/:id` | Admin updates a category | `{"name":"Frozen Items","description":"Frozen grocery products"}` | `{"_id":"<id>","name":"Frozen Items","description":"Frozen grocery products"}` |

| DELETE | `/api/categories/:id` | Admin deletes an unused category | None | `{"message":"Category deleted successfully.","id":"<id>"}` |

Deleting a category with products assigned returns `409 Conflict`. Renaming a category updates matching product and saved shopping-list item category names.

### Products

| Method | Path | Purpose | Sample request | Sample response |
|---|---|---|---|---|
| GET | `/api/products` | List catalog products | None | `[{"_id":"<id>","name":"Fresh Tomato","category":"Vegetables","unitPrice":85,"unit":"kg"}]` |

| GET | `/api/products/:id` | Get one product | None | `{"_id":"<id>","name":"Fresh Tomato","category":"Vegetables","unitPrice":85,"unit":"kg"}` |

| POST | `/api/products` | Admin adds a product | `{"name":"Frozen Peas","category":"Other","unitPrice":120,"unit":"pack","icon":"🫛","description":"Frozen green peas"}` | `{"_id":"<id>","name":"Frozen Peas","category":"Other","unitPrice":120,"unit":"pack"}` |

| PUT | `/api/products/:id` | Admin updates a product | `{"unitPrice":135}` | `{"id":"<id>","name":"Frozen Peas","unitPrice":135,"updatedListsCount":2}` |

| DELETE | `/api/products/:id` | Admin deletes a catalog product | None | `{"message":"Product deleted successfully.","id":"<id>"}` |

Product categories must already exist. Changing a product price updates matching saved shopping-list items and their calculated list totals. Deleting a product does not delete existing saved list-item snapshots.

### Shopping Lists

| Method | Path | Purpose | Sample request | Sample response |
|---|---|---|---|---|
| GET | `/api/lists` | List shopping lists owned by the authenticated user | Bearer token; no body | `[{"id":"<id>","title":"Weekly Groceries","budget":1500,"totalCost":170,"status":"Pending","items":[]}]` |

| GET | `/api/lists/:id` | Get one owned list | Bearer token; no body | `{"id":"<id>","title":"Weekly Groceries","budget":1500,"totalCost":170,"status":"Pending","items":[]}` |

| POST | `/api/lists` | Create a list | `{"title":"Weekly Groceries","store":"Example Market","targetDate":"2026-10-20","budget":1500,"notes":"Optional notes","items":[{"productId":"<product-id>","quantity":2,"completed":false}]}` | `{"id":"<id>","title":"Weekly Groceries","budget":1500,"totalCost":170,"status":"Pending","items":[...]}` |

| PUT | `/api/lists/:id` | Update an owned list | `{"title":"Updated Groceries","budget":1800}` | `{"id":"<id>","title":"Updated Groceries","budget":1800,"totalCost":170,"status":"Pending","items":[...]}` |

| DELETE | `/api/lists/:id` | Delete an owned list | Bearer token; no body | `{"message":"Shopping list deleted successfully.","id":"<id>"}` |

List items must reference products in the catalog when added. Quantities must be positive. List total, item subtotals, and statuses are calculated by the server. A list is `Pending` if no items are purchased, `In Progress` if some items are purchased, and `Completed` if every item in a non-empty list is purchased. The budget must be between ₱0 and ₱1,000,000.

### Error Responses and Status Codes

| Status | Meaning | Example response |
|---|---|---|
| 200 | Successful request | `{"message":"Operation successful."}` |
| 201 | Resource created | `{"message":"Registration successful."}` |
| 400 | Invalid input | `{"message":"Budget must be between 0 and 1,000,000, or left blank."}` |
| 401 | Authentication required or invalid credentials | `{"message":"Invalid email or password."}` |
| 403 | User has insufficient permissions | `{"message":"Access denied. Admin privileges are required."}` |
| 404 | Resource or endpoint not found | `{"message":"Product not found."}` |
| 409 | Duplicate or conflicting operation | `{"message":"This category cannot be deleted while products are assigned to it."}` |
| 500 | Unexpected server error | `{"message":"An unexpected server error occurred."}` |
| 503 | Health check reports database disconnected | `{"server":"running","database":"disconnected"}` |

## Main Data Models

- **User:** name, email, password hash, role, timestamps.
- **Category:** name, normalized unique name, description, timestamps.
- **Product:** name, category, unit price, unit, icon, description, timestamps.
- **ShoppingList:** owner, title, store, target date, budget, notes, items, total cost, status, timestamps. Each list contains item snapshots with product name, category, price, quantity, completion, and purchase date.

## Project Structure

```text
CheckLit-server/
├── config/
├── middleware/
├── models/
├── routes/
├── scripts/
├── app.js
├── .env.example
└── README.md
```

## Known Limitations

- The API currently allows the frontend origin `http://localhost:5173`; adjust CORS configuration for another origin.
- MongoDB and a configured `.env` file are required to start the server.
- The seed script adds missing initial data but does not reset an existing admin password.
- Guest lists are browser-only and are not sent to this API.
- There is no automated test suite configured in the current project scripts.

## Frontend Repository

https://github.com/sun1362/CheckLit
