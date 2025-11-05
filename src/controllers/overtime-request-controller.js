const OvertimeRequestService = require("../services/overtime-request-service");

class OvertimeRequestController {
  static createOvertimeRequest = async (req, res) => {
    const result = await OvertimeRequestService.createOvertimeRequest(req);
    return res.status(200).json(result);
  };

  static getOvertimeRequests = async (req, res) => {
    const result = await OvertimeRequestService.getOvertimeRequests(req);
    return res.status(200).json(result);
  };

  static getOvertimeRequestById = async (req, res) => {
    const result = await OvertimeRequestService.getOvertimeRequestById(req);

    return res.status(200).json(result);
  };

  static updateOvertimeRequest = async (req, res) => {
    const overtimeRequest = await OvertimeRequestService.updateOvertimeRequest(
      req
    );

    return res.status(200).json(overtimeRequest);
  };

  static processOvertimeRequest = async (req, res) => {
    const overtimeRequest = await OvertimeRequestService.processOvertimeRequest(
      req
    );

    return res.status(200).json(overtimeRequest);
  };

  static deleteOvertimeRequest = async (req, res) => {
    const result = await OvertimeRequestService.deleteOvertimeRequest(req);

    return res.status(200).json(result);
  };

  static getMyOvertimeRequests = async (req, res) => {
    const result = await OvertimeRequestService.getMyOvertimeRequests(req);

    return res.status(200).json(result);
  };
}

module.exports = OvertimeRequestController;
