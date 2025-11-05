const asyncHandler = require("../middlewares/async-handler-middleware");
const UserService = require("../services/user-service");

class UserController {
  getUsers = async (req, res, next) => {
    var result = await UserService.getUsers();

    return res.status(200).json(result);
  };

  getCurrentUser = async (req, res, next) => {
    var result = await UserService.getCurrentUser(req);

    return res.status(200).json(result);
  }

   
}

module.exports = new UserController();
