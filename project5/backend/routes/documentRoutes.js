const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/documentController');
const { authenticate } = require('../middleware/auth');
const { documentUpload } = require('../middleware/upload');

router.use(authenticate);

router.get('/student/:studentId', DocumentController.getStudentDocs);
router.get('/my', DocumentController.getMyDocs);
router.post('/upload', documentUpload.single('file'), DocumentController.upload);
router.get('/:id/download', DocumentController.download);
router.get('/:id/preview', DocumentController.preview);
router.post('/:id/version', documentUpload.single('file'), DocumentController.addVersion);
router.delete('/:id', DocumentController.archive);
router.get('/checklist/:studentId/:semester', DocumentController.getChecklist);
router.get('/:id', DocumentController.getById);

module.exports = router;
