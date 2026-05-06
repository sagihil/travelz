const users = require("../models/users");

// פונקציה ליצירת ID ייחודי
const getNextId = () => {
  if (users.length === 0) return 1;
  return Math.max(...users.map(u => u.userId)) + 1;
};

exports.getAllUsers = (req, res) => {
  res.status(200).json({
    success: true,
    data: users,
    error: null
  });
};

exports.getUserById = (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_ID",
        message: "User id must be a valid number",
        details: { id: req.params.id }
      }
    });
  }

  const user = users.find((u) => u.userId === id);

  if (!user) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found",
        details: { userId: id }
      }
    });
  }

  res.status(200).json({
    success: true,
    data: user,
    error: null
  });
};

exports.createUser = (req, res) => {
  const { firstName, lastName, userRole } = req.body;

  if (!firstName || !lastName || !userRole) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Missing required fields: firstName, lastName, userRole",
        details: {
          requiredFields: ["firstName", "lastName", "userRole"]
        }
      }
    });
  }

  const newUser = {
    userId: getNextId(),
    firstName,
    lastName,
    createDate: new Date(),
    updateDate: new Date(),
    userRole
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    data: { userId: newUser.userId },
    error: null
  });
};

exports.updateUser = (req, res) => {
  const id = Number(req.params.id);
  const { firstName, lastName, userRole } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_ID",
        message: "User id must be a valid number",
        details: { id: req.params.id }
      }
    });
  }

  if (!firstName || !lastName || !userRole) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Missing required fields: firstName, lastName, userRole",
        details: {
          requiredFields: ["firstName", "lastName", "userRole"]
        }
      }
    });
  }

  const user = users.find((u) => u.userId === id);

  if (!user) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found",
        details: { userId: id }
      }
    });
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.userRole = userRole;
  user.updateDate = new Date();

  res.status(200).json({
    success: true,
    data: { userId: user.userId },
    error: null
  });
};

exports.deleteUser = (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_ID",
        message: "User id must be a valid number",
        details: { id: req.params.id }
      }
    });
  }

  const index = users.findIndex((u) => u.userId === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found",
        details: { userId: id }
      }
    });
  }

  const deletedUser = users.splice(index, 1)[0];

  res.status(200).json({
    success: true,
    data: { userId: deletedUser.userId },
    error: null
  });
};