const express = require('express');
const router = express.Router();

const ReportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireStudentRelationship } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// List generated reports
router.get('/', ReportController.getReports);
router.post('/', ReportController.createReport);
router.delete('/:id', ReportController.deleteReport);

// Stream PDF Report Card
router.get(
  '/pdf/student/:studentId',
  requireStudentRelationship,
  ReportController.downloadReportCardPDF
);
router.get(
  '/student/:studentId/report-card/pdf',
  requireStudentRelationship,
  ReportController.downloadReportCardPDF
);

// Stream Excel Exports (HOD / Mentor only)
router.get(
  '/export/students',
  authorize(ROLES.HOD, ROLES.MENTOR),
  ReportController.exportStudentsExcel
);

router.get(
  '/department/excel',
  authorize(ROLES.HOD, ROLES.MENTOR),
  ReportController.exportStudentsExcel
);

router.get(
  '/export/mentors',
  authorize(ROLES.HOD),
  ReportController.exportMentorsExcel
);

module.exports = router;
