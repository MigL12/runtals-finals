const express = require('express')
const vehicleController = require ('../controllers/vehicle_controller')

const vehicleRouter = express.Router()

vehicleRouter.post('/addv',vehicleController.addVehicle)
vehicleRouter.get('/view-all',vehicleController.viewAllVehicles)
vehicleRouter.put('/update/:id',vehicleController.updateVehicle)
vehicleRouter.delete('/delete/:id',vehicleController.deleteVehicle)
vehicleRouter.get('/viewByBrand/:brand', vehicleController.viewVehiclesByBrand);
vehicleRouter.get('/viewByType/:type', vehicleController.viewVehiclesByType);
vehicleRouter.put('/updateQuantity/:vehicleId', vehicleController.updateQuantity);
vehicleRouter.get('/viewRentStatus/:id', vehicleController.viewRentalStatus);

module.exports = vehicleRouter       