const express = require('express');
const { getCalendarEvents, createCalendarEvent } = require('../controllers/calender.controller.js');

const router = express.Router();

router.get('/', getCalendarEvents);
router.post('/create', createCalendarEvent); 

module.exports = router;
