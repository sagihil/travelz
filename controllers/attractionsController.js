const attractions = require("../models/attractions");
const users = require("../models/users");
const getNextId = () => {
  if (attractions.length === 0) return 1;
  return Math.max(...attractions.map(a => a.id)) + 1;
};

exports.getAllAttractions = (req, res) => {
  const { country } = req.query;

  let filteredAttractions = attractions;

  if (country) {
    filteredAttractions = attractions.filter(
      (a) => a.country.toLowerCase() === country.toLowerCase()
    );
  }

  res.status(200).json({
    success: true,
    data: filteredAttractions,
    error: null
  });
};

exports.getAttractionById = (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_ID",
        message: "Attraction id must be a valid number",
        details: { id: req.params.id }
      }
    });
  }

  const attraction = attractions.find((a) => a.id === id);

  if (!attraction) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "ATTRACTION_NOT_FOUND",
        message: "Attraction not found",
        details: { id }
      }
    });
  }

  res.status(200).json({
    success: true,
    data: attraction,
    error: null
  });
};

exports.createAttraction = (req, res) => {
  const { name, city, country, category, price, rating, user_id } = req.body;

  if (
    !name ||
    !city ||
    !country ||
    !category ||
    price === undefined ||
    rating === undefined ||
    user_id === undefined
  ) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Missing required fields: name, city, country, category, price, rating, user_id",
        details: {
          requiredFields: ["name", "city", "country", "category", "price", "rating", "user_id"]
        }
      }
    });
  }

  // בדיקה אם המשתמש קיים
  const userExists = users.some(
    (u) => u.userId === Number(user_id)
  );

  if (!userExists) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_USER_ID",
        message: "User id does not exist.",
        details: { user_id }
      }
    });
  }

  const newAttraction = {
    id: getNextId(),
    name,
    city,
    country,
    category,
    price,
    rating,
    user_id
  };

  attractions.push(newAttraction);

  res.status(201).json({
    success: true,
    data: { id: newAttraction.id },
    error: null
  });
};

exports.updateAttraction = (req, res) => {
  const id = Number(req.params.id);
  const { name, city, country, category, price, rating, user_id } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_ID",
        message: "Attraction id must be a valid number",
        details: { id: req.params.id }
      }
    });
  }

  if (
    !name ||
    !city ||
    !country ||
    !category ||
    price === undefined ||
    rating === undefined ||
    user_id === undefined
  ) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Missing required fields: name, city, country, category, price, rating, user_id",
        details: {
          requiredFields: ["name", "city", "country", "category", "price", "rating", "user_id"]
        }
      }
    });
  }

  const attraction = attractions.find((a) => a.id === id);

  if (!attraction) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "ATTRACTION_NOT_FOUND",
        message: "Attraction not found",
        details: { id }
      }
    });
  }

  attraction.name = name;
  attraction.city = city;
  attraction.country = country;
  attraction.category = category;
  attraction.price = price;
  attraction.rating = rating;
  attraction.user_id = user_id;

  res.status(200).json({
    success: true,
    data: { id: attraction.id },
    error: null
  });
};

exports.deleteAttraction = (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_ID",
        message: "Attraction id must be a valid number",
        details: { id: req.params.id }
      }
    });
  }

  const index = attractions.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "ATTRACTION_NOT_FOUND",
        message: "Attraction not found",
        details: { id }
      }
    });
  }

  const deletedAttraction = attractions.splice(index, 1)[0];

  res.status(200).json({
    success: true,
    data: { id: deletedAttraction.id },
    error: null
  });
};