const express = require('express');
const router = express.Router();
const { createFolder, getFolders, deleteFolder } = require('../controllers/folderController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .post(createFolder)
  .get(getFolders);

router.route('/:id')
  .delete(deleteFolder);

module.exports = router;
