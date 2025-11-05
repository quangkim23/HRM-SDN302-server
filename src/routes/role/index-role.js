const roleController = require("../../controllers/role-controller");
const asyncHandler = require("../../middlewares/async-handler-middleware");

const roleRouter = require("express").Router();

roleRouter.get("/getRole/:id", asyncHandler(roleController.getRole));

roleRouter.get("/getRoles", asyncHandler(roleController.getRoles));

roleRouter.post("/createRole", asyncHandler(roleController.createRole));

roleRouter.delete("/deleteRole/:id", asyncHandler(roleController.deleteRole));

roleRouter.put("/updateRole/:id", asyncHandler(roleController.updateRole));

roleRouter.patch("/updateRole/:id/permissions", asyncHandler(roleController.updatePermissions));

roleRouter.get("/getPermissions", asyncHandler(roleController.getPermissions));

module.exports = roleRouter;
