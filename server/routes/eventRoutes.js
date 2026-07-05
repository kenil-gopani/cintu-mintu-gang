const router  = require('express').Router()
const ctrl    = require('../controllers/eventController')
const protect = require('../middleware/authMiddleware')

router.use(protect)
router.get('/',         ctrl.getAllEvents)
router.post('/',        ctrl.createEvent)
router.put('/:id',      ctrl.updateEvent)
router.delete('/:id',   ctrl.deleteEvent)
router.post('/:id/rsvp',ctrl.rsvpEvent)
router.post('/:id/expense', ctrl.addExpense)

module.exports = router
