const express = require('express');
const router = express.Router();
const { addAttachment, fetchAttachments, deleteAttachment } = require('../controllers/attachmentController');
const { protect } = require('../middlewares/authMiddleware');

// All attachment routes are protected
router.use(protect);

router.post('/', addAttachment);
router.get('/', fetchAttachments);
router.delete('/:id', deleteAttachment);

module.exports = router;
