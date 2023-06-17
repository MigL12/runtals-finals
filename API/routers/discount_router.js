const express = require('express')
const discController = require('../controllers/discount_controller')

const discRouter = express.Router()

discRouter.post('/addD', discController.addDiscount)
discRouter.get('/viewD', discController.viewAllDiscounts)
discRouter.put('/updateD/:discountId', discController.updateDiscount)
discRouter.delete('/deleteD/:discountId', discController.deleteDiscount)

module.exports = discRouter
