const express = require('express');
const router = express.Router();
const { ingest } = require('../controllers/ingestController');

router.post('/', ingest);

module.exports = router;
