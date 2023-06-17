const express = require('express')
const rentalController = require('../controllers/rentals_controller')

const rentalRouter = express.Router()

rentalRouter.post('/addRent', rentalController.addRental)
rentalRouter.get('/viewRent',rentalController.getAllRentals)
rentalRouter.put('/updateRent/:rentalId', rentalController.updateRental)
rentalRouter.delete('/deleteRent/:rentalId', rentalController.deleteRental)
rentalRouter.get('/getRent/:userId',rentalController.getRentalPerUser)
rentalRouter.put('/returnRent/:rentalId', rentalController.returnRental);

module.exports = rentalRouter