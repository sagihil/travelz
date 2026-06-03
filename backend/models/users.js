// models/users.js
// ---------------
// Purpose: In-memory user data store.
//
// Each user now has an email and a plain-text password so the POST /api/auth/login
// endpoint can validate credentials exactly. In a production application these
// passwords would be hashed with bcrypt – they are stored as plain text here only
// to keep the project simple enough for a university assignment.
//
// Roles: admin | manager | user
//   - admin   → can read, create, update, and delete anything
//   - manager → can read and update; cannot delete
//   - user    → can only read and update their own record
//
// Used by: authController, usersController, settingsController

let users = [
  {
    userId: 1,
    firstName: "Hila",
    lastName: "Sagi",
    email: "hila.sagi@travelz.com",
    password: "Admin@123",          // exact password required at login
    createDate: new Date(),
    updateDate: new Date(),
    userRole: "admin"
  },
  {
    userId: 2,
    firstName: "Daniel",
    lastName: "Cohen",
    email: "daniel.cohen@travelz.com",
    password: "Daniel@456",
    createDate: new Date(),
    updateDate: new Date(),
    userRole: "user"
  },
  {
    userId: 3,
    firstName: "Chen",
    lastName: "Birnfeld",
    email: "chen.birnfeld@travelz.com",
    password: "Admin@789",
    createDate: new Date(),
    updateDate: new Date(),
    userRole: "admin"
  },
  {
    userId: 4,
    firstName: "Noa",
    lastName: "Levi",
    email: "noa.levi@travelz.com",
    password: "Manager@1",
    createDate: new Date(),
    updateDate: new Date(),
    userRole: "manager"
  },
  {
    userId: 5,
    firstName: "Yossi",
    lastName: "Mizrahi",
    email: "yossi.mizrahi@travelz.com",
    password: "User@456",
    createDate: new Date(),
    updateDate: new Date(),
    userRole: "user"
  },
  {
    userId: 6,
    firstName: "Maya",
    lastName: "Katz",
    email: "maya.katz@travelz.com",
    password: "Manager@2",
    createDate: new Date(),
    updateDate: new Date(),
    userRole: "manager"
  },
  {
    userId: 7,
    firstName: "Omer",
    lastName: "Ben David",
    email: "omer.bendavid@travelz.com",
    password: "User@789",
    createDate: new Date(),
    updateDate: new Date(),
    userRole: "user"
  }
];

module.exports = users;
