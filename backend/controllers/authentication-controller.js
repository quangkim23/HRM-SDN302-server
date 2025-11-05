const AuthenticationService = require("../services/authentication-service");

class AuthenticationController {
  register = async (req, res, next) => {
    var result = await AuthenticationService.register(req);
    return res.status(201).json(result);
  };

  login = async (req, res, next) => {
    var result = await AuthenticationService.login(req, res);

    return res.status(200).json(result);
  }

  refreshAccessToken = async (req, res, next) => {
    var result = await AuthenticationService.refreshAccessToken(req);

    return res.status(200).json(result);
  }


  logout = async (req, res, next) => {
    let result = await AuthenticationService.logout(req, res);
    
    return res.status(200).json(result);
  }

  forgotPassword = async (req, res, next) => {
    let result = await AuthenticationService.forgotPassword(req);

    return res.status(200).json(result);
  }

  confirmForgotPassword = async (req, res, next) => {
    let result = await AuthenticationService.ConfirmForgotPassword(req);

    return res.status(200).json(result);
  }
}

module.exports = new AuthenticationController();
