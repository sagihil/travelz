const express = require("express");
const router = express.Router();

const usersController = require("../controllers/usersController");
const authorize = require("../middleware/authorize");

// כולם יכולים לראות
router.get("/", usersController.getAllUsers);
router.get("/:id", usersController.getUserById);

// כולם יכולים ליצור
router.post("/", usersController.createUser);

// רק admin + manager יכולים לעדכן
router.put("/:id", authorize(["admin", "manager"]), usersController.updateUser);

// רק admin יכול למחוק
router.delete("/:id", authorize(["admin"]), usersController.deleteUser);

module.exports = router;