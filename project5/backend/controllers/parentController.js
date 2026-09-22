const ParentService = require('../services/parentService');
const ApiResponse = require('../utils/apiResponse');

class ParentController {
  static async getChildOverview(req, res, next) {
    try {
      const data = await ParentService.getChildProfile(req.user._id);
      return ApiResponse.success(res, data, 'Linked child academic profile and progress');
    } catch (err) {
      next(err);
    }
  }

  static async getChildSemesterAcademics(req, res, next) {
    try {
      const data = await ParentService.getChildSemesterMarks(req.user._id, req.params.semester);
      return ApiResponse.success(res, data, 'Child semester academic records');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ParentController;
