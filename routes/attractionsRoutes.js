const express = require("express");
const router = express.Router();

const attractionsController = require("../controllers/attractionsController");
const authorize = require("../middleware/authorize");

router.get("/", attractionsController.getAllAttractions);
router.get("/:id", attractionsController.getAttractionById);
router.post("/", attractionsController.createAttraction);
router.put("/:id", authorize(["admin", "manager"]), attractionsController.updateAttraction);
router.delete("/:id", authorize(["admin"]), attractionsController.deleteAttraction);

module.exports = router;