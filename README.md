
# CheckLit Server

CheckLit Server is the Express.js REST API for the CheckLit grocery shopping list application. It uses MongoDB and Mongoose to store user accounts, product categories, products, and shopping lists.

## Technologies

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT authentication
- bcryptjs
- Axios-compatible JSON REST API

## Requirements

- Node.js and npm
- A MongoDB database
- Environment variables configured in `.env`

## Installation

```bash
npm install
```

Create a `.env` file based on `.env.example` and configure the required environment variables.

Required variables:

- `MONGO_URI`
- `JWT_SECRET`

The seed script also requires:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

An optional `PORT` variable controls the server port. The default is `8000`.

## Running the Server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Seed the initial admin account, categories, and products:

```bash
npm run seed
```

The seed script adds missing default categories and products without resetting existing products with matching names.

## Base URL

Local development:

`http://localhost:8000/api`

The React development server normally runs at:

`http://localhost:5173`

The server currently allows that frontend origin through CORS.

## Authentication

Registration and login return a JWT token and user information.

Include this header when calling protected endpoints:

`Authorization: Bearer <token>`

Public registration creates a regular user. Administrator privileges are assigned separately through the server-side seed process or trusted database administration.

## API Endpoints

### Health

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | Check whether the API is running |
| GET | `/api/health` | Public | Check server and database status |

### Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a regular user |
| POST | `/api/auth/login` | Public | Authenticate a user and return a token |

Registration request:

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "password": "your-password"
}
```

Login request:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

### User Profile

All profile endpoints require authentication.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/profile` | Authenticated | Retrieve the current user's profile |
| PUT | `/api/profile` | Authenticated | Update the user's name |
| PATCH | `/api/profile/password` | Authenticated | Change the password |

Profile update request:

```json
{
  "name": "Updated Name"
}
```

Password change request:

```json
{
  "currentPassword": "current-password",
  "newPassword": "new-password"
}
```

### Categories

Category browsing is public. Category management requires an administrator token.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/categories` | Public | Retrieve all categories |
| GET | `/api/categories/:id` | Public | Retrieve one category |
| POST | `/api/categories` | Admin | Create a category |
| PUT | `/api/categories/:id` | Admin | Update a category |
| DELETE | `/api/categories/:id` | Admin | Delete a category if no products use it |

Create-category request:

```json
{
  "name": "Frozen Foods",
  "description": "Frozen grocery products"
}
```

Category deletion is blocked when products remain assigned to the category. Renaming a category also updates matching product and shopping-list item category names.

### Products

Product browsing is public. Creating, editing, and deleting products requires an administrator token.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/products` | Public | Retrieve the product catalog |
| GET | `/api/products/:id` | Public | Retrieve one product |
| POST | `/api/products` | Admin | Create a product |
| PUT | `/api/products/:id` | Admin | Update a product |
| DELETE | `/api/products/:id` | Admin | Delete a product |

Create-product request:

```json
{
  "name": "Frozen Peas",
  "category": "Frozen Foods",
  "unitPrice": 120,
  "unit": "pack",
  "icon": "🫛",
  "description": "Frozen green peas"
}
```

The selected category must already exist in the database. Updating a product's price updates matching saved shopping-list item prices and recalculates list totals. Deleting a product does not automatically remove its previously saved shopping-list entries.

### Shopping Lists

All shopping-list endpoints require authentication. Users can access only their own lists.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/lists` | Authenticated | Retrieve the current user's lists |
| GET | `/api/lists/:id` | Owner | Retrieve one owned list |
| POST | `/api/lists` | Authenticated | Create a shopping list |
| PUT | `/api/lists/:id` | Owner | Update an owned list |
| DELETE | `/api/lists/:id` | Owner | Delete an owned list |

Create-list request:

```json
{
  "title": "Weekly Groceries",
  "store": "Example Market",
  "targetDate": "2026-10-20",
  "budget": 1500,
  "notes": "Optional shopping notes",
  "items": [
    {
      "productId": "PRODUCT_OBJECT_ID",
      "quantity": 2,
      "completed": false
    }
  ]
}
```

List totals and item subtotals are calculated by the server. Quantities must be positive, and newly added items must reference existing catalog products.

List status is derived from item completion:

- `Pending`: no purchased items, or the list is empty
- `In Progress`: some items are purchased
- `Completed`: all items in a non-empty list are purchased

Purchase dates are recorded when an item becomes purchased and cleared when it is unchecked.

## Common HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Request succeeded |
| 201 | Resource created |
| 400 | Invalid request data |
| 401 | Missing, invalid, or expired authentication |
| 403 | Authenticated user lacks permission |
| 404 | Resource or endpoint not found |
| 409 | Conflict, such as a duplicate category or a category still in use |
| 500 | Unexpected server error |
| 503 | Service unavailable, such as a disconnected database health check |

Errors are returned as JSON with a readable message.

## Main Data Models

- `User`: user name, email, hashed password, role, timestamps
- `Category`: category name, normalized name, description, timestamps
- `Product`: name, category, unit price, unit, icon, description, timestamps
- `ShoppingList`: owner, title, store, target date, budget, notes, items, total cost, status, timestamps

## Project Structure

```text
CheckLit-server/
├── config/
├── middleware/
├── models/
├── routes/
├── scripts/
├── app.js
├── package.json
├── .env.example
└── README.md
```

## Security Notes

- Keep `.env` out of version control.
- Never expose JWT secrets or database credentials in frontend code.
- Public registration always creates a regular user.
- Protected routes enforce authentication and role permissions on the server.
- Passwords are hashed before being stored.
- Frontend route guards do not replace backend authorization.
