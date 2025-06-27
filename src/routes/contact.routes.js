const express = require('express');
const router = express.Router();
const { sendContactForm } = require('../controllers/contact.controller');

router.post('/', sendContactForm);

module.exports = router; 