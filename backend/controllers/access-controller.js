const { OK, CREATED } = require("../core/success-response");
const AccessService = require("../services/access-service");

class AccessController {
  signUp = async (req, res, next) => {
    var result = await AccessService.signUp(req.body);

    new OK({
      message: "Registered OK!",
      metadata: result
    }).send(res);
  };
}

module.exports = new AccessController();
