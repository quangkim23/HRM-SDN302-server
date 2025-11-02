const ErrorMessages = require("../constants/error-message");
const ErrorTypes = require("../constants/error-type");
const CustomError = require("../core/custom-error");
const roleModel = require("../models/role-model");
const PermissionResourceAction = require("../constants/permission-resource-action");

class RoleService {
  static async getRoles() {
    let roles = await roleModel.find({});

    return roles;
  }

  static async getRoleById(req) {
    const { id } = req.params;

    if (!id)
      throw new CustomError(
        ErrorTypes.missingInput,
        ErrorMessages.missingInput
      );

    let role = await roleModel.findById(id);

    if (!role)
      throw new CustomError(
        ErrorTypes.RoleIsNotExist,
        ErrorMessages.RoleIsNotExist
      );
    
    return role;
  }

  static async createRole(req){
    const {name, actions} = req.body;

    if(!name) throw new CustomError(ErrorTypes.missingInput, ErrorMessages.missingInput);

    let roleExist = await roleModel.findOne({name: {$regex: new RegExp(`^${name}$`, 'i')}});

    if(roleExist) throw new CustomError(ErrorTypes.RoleNameExist, ErrorMessages.RoleNameExist);

    let newRole = await roleModel.create({name, actions});

    return newRole;
  }

  static async deleteRoleById(req){
    const {id} = req.params;

    if(!id) throw new CustomError(ErrorTypes.missingInput, ErrorMessages.missingInput);

    let result = await roleModel.findByIdAndDelete(id);

    return result;
  }

  static async updateRoleById(req){
    const {id} = req.params;
    const {...updateRole} = req.body;

    if(!id || Object.keys(updateRole).length == 0) throw new CustomError(ErrorTypes.missingInput, ErrorMessages.missingInput);

    let updated = await roleModel.findByIdAndUpdate(id, updateRole, {new: true});

    return updated;
  }

  static async getPermissions(req) {

    const resources = PermissionResourceAction.getResourcesWithDisplayNames();
    
    const permissions = PermissionResourceAction.toPermissionsList();

    return {
      success: true,
      data: {
        permissions: permissions,
        resources: resources
      },
      message: "Lấy danh sách quyền thành công"
    };
  }

  static async updatePermissions(req) {
    const {id} = req.params;

    const {permissions} = req.body;

    let updatedRole = await roleModel.findByIdAndUpdate(id, {permissions});

    return updatedRole;
  }
}

module.exports = RoleService;
