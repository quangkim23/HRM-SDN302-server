const ErrorMessages = require("../constants/error-message");
const ErrorTypes = require("../constants/error-type");
const CustomError = require("../core/custom-error");
const roleModel = require("../models/role-model");
const RoleService = require("../services/role-service");


class RoleController {

    
  getRole = async (req, res, next) => {
    let result = await RoleService.getRoleById(req);

    return res.status(200).json(result);
  };

  getRoles = async (req, res, next) => {

    let result = await RoleService.getRoles(req);

    return res.status(200).json(result);
  }

  createRole = async (req, res, next) => {
    let result = await RoleService.createRole(req);

    return res.status(200).json(result);
  };

  deleteRole = async (req, res, next) => {
    let result = await RoleService.deleteRoleById(req);

    return res.status(200).json(result);
  };

  updateRole = async (req, res, next) => {
    let result = await RoleService.updateRoleById(req);

    return res.status(200).json(result);
  };


  getPermissions = async (req, res, next) => {
    let result = await RoleService.getPermissions(req);

    return res.status(200).json(result);
  }

  updatePermissions = async (req, res, next) => {
    let result = await RoleService.updatePermissions(req);

    return res.status(200).json(result);
  }
}

module.exports = new RoleController();
