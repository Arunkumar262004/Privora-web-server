const express = require('express');
const router = express.Router();
const { addAttachment, fetchAttachments } = require('../controllers/attachmentController');
const { protect } = require('../middlewares/authMiddleware');

// All attachment routes are protected
router.use(protect);

router.post('/', addAttachment);
router.get('/', fetchAttachments);

module.exports = router;
