const express = require('express');
const router = express.Router();
const { ingest, ingestBackend } = require('../controllers/ingestController');

router.post('/', ingest);
router.post('/backend', ingestBackend);

module.exports = router;
