const status = require('statuses');
const VehicleModel = require('../models/vehicle_model')
const database = require('../models/vehicleconnection_db')


const addVehicle = (req, res, next) => {
  const { brand, model, type, yearmodel, price, plate, quantity } = req.body;

  // Define the allowed brands
  const allowedBrands = ['Toyota', 'Nissan', 'Mitsubishi', 'Honda'];
  const minYearModel = 1980
  const maxYearModel = 2023
  const minPrice = 0
  const maxPrice = 1000000

  // Regular expression pattern for validating the plate
  const platePattern = /^[A-Z]{3}\d{3}$/

  if (!brand || !model || !type || !yearmodel || !price || !plate || !quantity) {
    res.status(400).json({
      successful: false,
      message: 'Vehicle info is undefined or blank.',
    })
  } else if (!allowedBrands.includes(brand)) {
    res.status(400).json({
      successful: false,
      message: 'Invalid vehicle brand. Only Toyota, Nissan, Mitsubishi, and Honda are allowed.',
    })
  } else if (yearmodel < minYearModel || yearmodel > maxYearModel) {
    res.status(400).json({
      successful: false,
      message: `Invalid year model. Year model should be between ${minYearModel} and ${maxYearModel}.`,
    })
  } else if (price < minPrice || price > maxPrice) {
    res.status(400).json({
      successful: false,
      message: `Invalid price. Price should be between ${minPrice} and ${maxPrice}.`,
    })
  } else if (!platePattern.test(plate)) {
    res.status(400).json({
      successful: false,
      message: 'Invalid plate. Plate should consist of three letters followed by three numbers.',
    })
  } else {
    const selectQuery =
      'SELECT * FROM vehicles WHERE vehicle_brand = ? AND vehicle_model = ? AND vehicle_type = ? AND vehicle_yearmodel = ? AND vehicle_plate = ?'
    const selectValues = [brand, model, type, yearmodel, plate];

    database.db.query(selectQuery, selectValues, (err, rows) => {
      if (err) {
        console.error(err)
        res.status(500).json({
          successful: false,
          message: 'Error occurred while querying the database.',
        })
      } else {
        if (rows.length > 0) {
          // Entry already exists, increment the quantity
          const updateQuery =
            'UPDATE vehicles SET vehicle_quantity = vehicle_quantity + ?, vehicle_status = CASE WHEN vehicle_quantity + ? > 0 THEN "AVAILABLE" ELSE "RENTED" END WHERE vehicle_brand = ? AND vehicle_model = ? AND vehicle_type = ? AND vehicle_yearmodel = ?';
          const updateValues = [quantity, quantity, brand, model, type, yearmodel];

          database.db.query(updateQuery, updateValues, (err, result) => {
            if (err) {
              console.error(err)
              res.status(500).json({
                successful: false,
                message: 'Error occurred while updating the vehicle quantity and status.',
              })
            } else {
              res.status(200).json({
                successful: true,
                message: 'Vehicle quantity and status updated successfully.',
              })
            }
          })
        } else {
          // Entry doesn't exist, insert a new vehicle
          const insertQuery =
            'INSERT INTO vehicles (vehicle_brand, vehicle_model, vehicle_type, vehicle_yearmodel, vehicle_quantity, vehicle_price, vehicle_plate, vehicle_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
          const insertValues = [brand, model, type, yearmodel, quantity, price, plate, 'AVAILABLE']

          database.db.query(insertQuery, insertValues, (err) => {
            if (err) {
              console.error(err)
              res.status(500).json({
                successful: false,
                message: 'Error occurred while adding a new vehicle.',
              })
            } else {
              res.status(200).json({
                successful: true,
                message: 'Successfully added a new vehicle!',
              })
            }
          })
        }
      }
    })
  }
}

//viewvehiclebybrand 
//view vehicle by type
const viewAllVehicles = (req, res, next) => {
  const query = 'SELECT * FROM vehicles'

  database.db.query(query, (err, rows) => {
    if (err) {
      res.status(500).json({
        successful: false,
        message: err,
      })
    } else {
      if (rows.length === 0) {
        res.status(404).json({
          successful: false,
          message: 'No vehicles found',
        })
      } else {
        res.status(200).json({
          successful: true,
          vehicles: rows,
        })
      }
    }
  })
}
const updateVehicle = (req, res, next) => {
  const { id } = req.params
  const { brand, model, type, yearmodel } = req.body

  // Validate required fields
  if (!brand || !model || !type || !yearmodel) {
    res.status(400).json({
      successful: false,
      message: 'Missing required fields.',
    })
    return
  }

  // Define the allowed brands
  const allowedBrands = ['Toyota', 'Nissan', 'Mitsubishi', 'Honda']
  const minYearModel = 1980
  const maxYearModel = 2023

  if (!allowedBrands.includes(brand)) {
    res.status(400).json({
      successful: false,
      message: 'Invalid vehicle brand. Only Toyota, Nissan, Mitsubishi, and Honda are allowed.',
    })
    return
  }

  if (yearmodel < minYearModel || yearmodel > maxYearModel) {
    res.status(400).json({
      successful: false,
      message: `Invalid year model. Year model should be between ${minYearModel} and ${maxYearModel}.`,
    })
    return
  }

  const updateQuery = 'UPDATE vehicles SET vehicle_brand = ?, vehicle_model = ?, vehicle_type = ?, vehicle_yearmodel = ? WHERE vehicle_Id = ?'

  database.db.query(updateQuery, [brand, model, type, yearmodel, id], (err, result) => {
    if (err) {
      res.status(500).json({
        successful: false,
        message: err,
      })
    } else if (result.affectedRows === 0) {
      res.status(404).json({
        successful: false,
        message: 'Vehicle not found.',
      })
    } else {
      res.status(200).json({
        successful: true,
        message: 'Vehicle details updated successfully.',
      })
    }
  })
}

const deleteVehicle = (req, res, next) => {
    const { id } = req.params
  
    const selectQuery = 'SELECT vehicle_quantity FROM vehicles WHERE vehicle_Id = ?'
    database.db.query(selectQuery, id, (err, rows) => {
      if (err) {
        res.status(500).json({
          successful: false,
          message: err,
        })
      } else if (rows.length === 0) {
        res.status(404).json({
          successful: false,
          message: 'Vehicle not found.',
        })
      } else {
        const vehicleQuantity = rows[0].vehicle_quantity
  
        if (vehicleQuantity === 1) {
          // Vehicle quantity is 1, delete the vehicle
          const deleteQuery = 'DELETE FROM vehicles WHERE vehicle_Id = ?'
          database.db.query(deleteQuery, id, (err, result) => {
            if (err) {
              res.status(500).json({
                successful: false,
                message: err,
              })
            } else {
              res.status(200).json({
                successful: true,
                message: 'Vehicle deleted successfully.',
              })
            }
          })
        } else {
          // Vehicle quantity is more than 1, decrement the quantity
          const updateQuery = 'UPDATE vehicles SET vehicle_quantity = vehicle_quantity - 1 WHERE vehicle_Id = ?'
          database.db.query(updateQuery, id, (err, result) => {
            if (err) {
              res.status(500).json({
                successful: false,
                message: err,
              })
            } else {
              res.status(200).json({
                successful: true,
                message: 'Vehicle quantity decremented successfully.',
              })
            }
          })
        }
      }
    })
}
const viewVehiclesByBrand = (req, res) => {
  const brand = req.params.brand;

  const query = 'SELECT * FROM vehicles WHERE vehicle_brand = ?'

  database.db.query(query, [brand], (err, results) => {
    if (err) {
      return res.status(500).json({
        successful: false,
        message: err,
      })
    }

    if (results.length === 0) {
      return res.status(404).json({
        successful: false,
        message: 'No vehicles found for the specified brand.',
      })
    }

    return res.status(200).json({
      successful: true,
      vehicles: results,
    })
  })
}
const viewVehiclesByType = (req, res) => {
  const type = req.params.type

  const query = 'SELECT * FROM vehicles WHERE vehicle_type = ?'

  database.db.query(query, [type], (err, results) => {
    if (err) {
      return res.status(500).json({
        successful: false,
        message: err,
      })
    }

    if (results.length === 0) {
      return res.status(404).json({
        successful: false,
        message: 'No vehicles found for the specified type.',
      })
    }

    return res.status(200).json({
      successful: true,
      vehicles: results,
    })
  })
}
const updateQuantity = (req, res) => {
  const { vehicleId, vehicleStatus } = req.body

  if (!vehicleId || !vehicleStatus) {
    return res.status(400).json({
      successful: false,
      message: "Vehicle ID and status are required.",
    })
  }

  let increment = 0
  if (vehicleStatus === "Available") {
    increment = 1
  } else if (vehicleStatus === "Rented") {
    increment = -1
  }

  const updateQuery = `
    UPDATE vehicles
    SET quantity = quantity + ${increment}
    WHERE vehicle_Id = ?
  `

  database.db.query(updateQuery, [vehicleId], (err, result) => {
    if (err) {
      return res.status(500).json({
        successful: false,
        message: err,
      })
    }

    return res.status(200).json({
      successful: true,
      message: "Quantity updated successfully.",
    })
  })
}

const viewVehiclesByStatus = (req, res) => {
  const status = req.params.status

  const query = 'SELECT * FROM vehicles WHERE vehicle_status = ?'

  database.db.query(query, [status], (err, results) => {
    if (err) {
      return res.status(500).json({
        successful: false,
        message: err,
      })
    }

    if (results.length === 0) {
      return res.status(404).json({
        successful: false,
        message: 'No vehicles available.',
      })
    }

    return res.status(200).json({
      successful: true,
      vehicles: results,
    })
  })
}
// add repairing vehicles
// update quantity
const deleteVehicle1 = (req, res, next) => {
  const { id } = req.params

  const selectQuery = 'SELECT vehicle_quantity FROM vehicles WHERE vehicle_Id = ?';
  database.db.query(selectQuery, id, (err, rows) => {
    if (err) {
      res.status(500).json({
        successful: false,
        message: err,
      });
    } else if (rows.length === 0) {
      res.status(404).json({
        successful: false,
        message: 'Vehicle not found.',
      });
    } else {
      const vehicleQuantity = rows[0].vehicle_quantity;

      if (vehicleQuantity === 1) {
        // Vehicle quantity is 1, update the status to "UNAVAILABLE"
        const updateStatusQuery = 'UPDATE vehicles SET vehicle_status = ? WHERE vehicle_Id = ?'
        const updateStatusValues = ['UNAVAILABLE', id]

        database.db.query(updateStatusQuery, updateStatusValues, (err, result) => {
          if (err) {
            res.status(500).json({
              successful: false,
              message: err,
            })
          } else {
            res.status(200).json({
              successful: true,
              message: 'Vehicle is now UNAVAILABLE.',
            })
          }
        })
      } else if (vehicleQuantity === 0) {
        // Vehicle quantity is 0, update the status to "UNAVAILABLE"
        const updateStatusQuery = 'UPDATE vehicles SET vehicle_status = ? WHERE vehicle_Id = ?';
        const updateStatusValues = ['UNAVAILABLE', id]

        database.db.query(updateStatusQuery, updateStatusValues, (err, result) => {
          if (err) {
            res.status(500).json({
              successful: false,
              message: err,
            })
          } else {
            res.status(200).json({
              successful: true,
              message: 'Vehicle status updated to UNAVAILABLE.',
            })
          }
        })
      } else {
        // Vehicle quantity is more than 1, decrement the quantity
        const updateQuery = 'UPDATE vehicles SET vehicle_quantity = vehicle_quantity - 1 WHERE vehicle_Id = ?';
        database.db.query(updateQuery, id, (err, result) => {
          if (err) {
            res.status(500).json({
              successful: false,
              message: err,
            })
          } else {
            res.status(200).json({
              successful: true,
              message: 'Vehicle quantity decremented successfully.',
            })
          }
        })
      }
    }
  })
}

const viewRentalStatus = (req, res) => {
  const vehicleId = req.params.id

  if (!vehicleId) {
    return res.status(400).json({
      successful: false,
      message: 'Vehicle ID is missing.',
    })
  }

  const selectQuery = 'SELECT vehicle_status FROM vehicles WHERE vehicle_Id = ?'
  database.db.query(selectQuery, [vehicleId], (err, result) => {
    if (err) {
      return res.status(500).json({
        successful: false,
        message: 'Error occurred while querying the database.',
      })
    }

    if (result.length === 0) {
      return res.status(404).json({
        successful: false,
        message: 'Vehicle not found.',
      })
    }

    const rentalStatus = result[0].vehicle_status;

    return res.status(200).json({
      successful: true,
      rental_status: rentalStatus,
    })
  })
}

module.exports = {
  addVehicle,
  viewAllVehicles,
  updateVehicle,
  deleteVehicle,
  viewVehiclesByBrand,
  viewVehiclesByType,
  updateQuantity,
  viewVehiclesByStatus,
  deleteVehicle1,
  viewRentalStatus
}
