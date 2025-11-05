const jwt = require("jsonwebtoken");

const generateAccessToken = (userId, employeeId, roles) =>
  jwt.sign({ _id: userId, employeeId: employeeId, roles: roles }, process.env.JWT_SECRET, {
    expiresIn: `${process.env.EXPIRES_IN_ACCESS_TOKEN}`,
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ _id: userId}, process.env.JWT_SECRET, {
    expiresIn: `${process.env.EXPIRES_IN_REFRESH_TOKEN}`,
  });

module.exports = {
  generateAccessToken,
  generateRefreshToken
};
