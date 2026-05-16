# Travel Backend API
Backend API project for a travel planning system, built with Node.js and Express.js.  
The API currently uses mock data only and does not connect to a real database.

# Technologies Used
- Node.js
- Express.js
- Postman
- Git & GitHub
- Mock Data / In-Memory Data

# Installation
Install dependencies:
```bash
npm install
```

# Running the Server
Start the server:
```bash
node server.js
```
The server will run on:

```txt
http://localhost:3000
```

---

# Base URL

```txt
http://localhost:3000
```

---

# General Response Format

## Success Response

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

## Error Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

---

# Authorization

Some routes are protected using role-based authorization.

The role is sent through request headers:

```txt
x-user-role: admin
```

## Available Roles

- admin
- manager
- user

For a regular user updating only their own data:

```txt
x-user-id: 2
```

## Authorization Rules

- Admin can update and delete records.
- Manager can update records.
- Regular users can update only their own user record.
- Unauthorized requests return `403 Forbidden`.

---

# Users API

## Get All Users

```http
GET /users
```

Returns all users.

---

## Get User By ID

```http
GET /users/:id
```

### Example

```http
GET /users/1
```

---

## Create User

```http
POST /users
```

### Request Body

```json
{
  "firstName": "Hila",
  "lastName": "Sagi",
  "userRole": "admin"
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "userId": 8
  },
  "error": null
}
```

---

## Update User

```http
PUT /users/:id
```

### Headers for Admin or Manager

```txt
x-user-role: admin
```

or

```txt
x-user-role: manager
```

### Request Body

```json
{
  "firstName": "Chen",
  "lastName": "Birnfeld",
  "userRole": "user"
}
```

### Regular User Updating Themselves

```txt
x-user-role: user
x-user-id: 2
```

The request must match the same user ID:

```http
PUT /users/2
```

---

## Delete User

```http
DELETE /users/:id
```

### Headers

```txt
x-user-role: admin
```

Only admins can delete users.

---

# Attractions API

## Get All Attractions

```http
GET /attractions
```

Returns all attractions.

---

## Filter Attractions By Country

```http
GET /attractions?country=France
```

### Example

```http
GET /attractions?country=Israel
```

Uses query parameters for filtering attractions by country.

---

## Get Attraction By ID

```http
GET /attractions/:id
```

### Example

```http
GET /attractions/1
```

---

## Create Attraction

```http
POST /attractions
```

### Request Body

```json
{
  "name": "BGU",
  "city": "Beer Sheva",
  "country": "Israel",
  "category": "University",
  "price": 0,
  "rating": 2,
  "user_id": 1
}
```

The `user_id` must belong to an existing user.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": 6
  },
  "error": null
}
```

---

## Update Attraction

```http
PUT /attractions/:id
```

### Headers

```txt
x-user-role: admin
```

or

```txt
x-user-role: manager
```

### Request Body

```json
{
  "name": "Eiffel Tower",
  "city": "Paris",
  "country": "France",
  "category": "Landmark",
  "price": 35,
  "rating": 4.8,
  "user_id": 1
}
```

---

## Delete Attraction

```http
DELETE /attractions/:id
```

### Headers

```txt
x-user-role: admin
```

Only admins can delete attractions.

---

# Validation & Error Examples

## Invalid ID

### Example

```http
GET /users/abc
```

### Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_ID",
    "message": "User id must be a valid number",
    "details": {
      "id": "abc"
    }
  }
}
```

---

## User Not Found

### Example

```http
GET /users/999
```

### Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "details": {
      "userId": 999
    }
  }
}
```

---

## Forbidden Request

### Example

```http
DELETE /users/1
```

Without the correct authorization header.

### Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": {}
  }
}
```

---

## Invalid User ID For Attraction

### Example Request Body

```json
{
  "name": "BGU",
  "city": "Beer Sheva",
  "country": "Israel",
  "category": "University",
  "price": 0,
  "rating": 2,
  "user_id": 999
}
```

### Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_USER_ID",
    "message": "User id does not exist.",
    "details": {
      "user_id": 999
    }
  }
}
```

---

# Assumptions

- The project uses mock data only.
- Data is stored in memory.
- All changes reset when the server restarts.
- IDs are generated using the maximum existing ID + 1.
- There is no real authentication system.
- Authorization is simulated using request headers.
- The `user_id` field in attractions represents the creator of the attraction.

---

# Postman Testing

The project was tested using Postman.

The Postman collection includes:

- Users CRUD requests
- Attractions CRUD requests
- Path parameters examples
- Query parameter filtering examples
- Authorization examples
- Error handling examples


---

# Submission Files

The final submission should include:

- Backend source code
- README.md
- Exported Postman collection JSON file
- Screenshots of successful requests
- Screenshots of error requests