const discModel = require('../models/discount_model')
const database = require('../models/vehicleconnection_db')

//revisions: 
// add discounts by brand

const addDiscount = (req, res, next) => {
  const discName = req.body.disc_name
  const discPercentage = req.body.disc_percentage
  const vehicleId = req.body.vehicle_id
  const vehicleBrand = req.body.vehicle_brand

  if (!discName || !discPercentage || (!vehicleId && !vehicleBrand)) {
    return res.status(400).json({
      successful: false,
      message: 'One or more discount details are missing.',
    })
  }

  if (vehicleId) {
    const selectVehicleQuery = `SELECT * FROM vehicles WHERE vehicle_id = ?`;
    database.db.query(selectVehicleQuery, [vehicleId], (err, vehicleRows) => {
      if (err) {
        return res.status(500).json({
          successful: false,
          message: err,
        })
      }

      if (vehicleRows.length === 0) {
        return res.status(400).json({
          successful: false,
          message: 'Invalid vehicle_id. Vehicle not found.',
        })
      }

      const originalPrice = vehicleRows[0].vehicle_price;
      const discountedPrice = originalPrice - (originalPrice * discPercentage) / 100

      const insertQuery = 'INSERT INTO discounts (disc_name, disc_percentage, vehicle_id) VALUES (?, ?, ?)'
      const insertValues = [discName, discPercentage, vehicleId];

      database.db.query(insertQuery, insertValues, (err, result) => {
        if (err) {
          return res.status(500).json({
            successful: false,
            message: err,
          })
        }

        // Update the vehicle price with the discounted price
        const updateVehicleQuery = 'UPDATE vehicles SET discount_price = ? WHERE vehicle_id = ?'
        const updateValues = [discountedPrice, vehicleId]

        database.db.query(updateVehicleQuery, updateValues, (err, updateResult) => {
          if (err) {
            return res.status(500).json({
              successful: false,
              message: err,
            })
          }

          return res.status(200).json({
            successful: true,
            message: 'Successfully added new discount!',
          })
        })
      })
    })
  } else if (vehicleBrand) {
    const updateQuery = 'UPDATE vehicles SET discount_price = vehicle_price - (vehicle_price * ?) / 100 WHERE vehicle_brand = ?'
    const updateValues = [discPercentage, vehicleBrand]

    database.db.query(updateQuery, updateValues, (err, result) => {
      if (err) {
        return res.status(500).json({
          successful: false,
          message: err,
        })
      }

      return res.status(200).json({
        successful: true,
        message: 'Discount applied successfully for the specified brand.',
      })
    })
  }
}
const viewAllDiscounts = (req, res, next) => {
  const selectQuery = `
    SELECT d.*, v.vehicle_price
    FROM discounts d
    LEFT JOIN vehicles v ON d.vehicle_id = v.vehicle_id
  `

  database.db.query(selectQuery, (err, result) => {
    if (err) {
      return res.status(500).json({
        successful: false,
        message: err,
      })
    }

    const discounts = result.map((discount) => {
      const originalPrice = discount.vehicle_price;
      const discountedPrice = originalPrice - (originalPrice * discount.disc_percentage) / 100;
      return {
        ...discount,
        discounted_price: discountedPrice,
      }
    })

    return res.status(200).json({
      successful: true,
      message: 'Successfully retrieved all discounts.',
      discounts: discounts,
    })
  })
}
// per brand disc add query
const updateDiscount = (req, res, next) => {
    const { discountId } = req.params
    const { disc_name, disc_percentage, vehicle_id } = req.body
  
    if (!disc_percentage && disc_percentage !== 0) {
      return res.status(400).json({
        successful: false,
        message: "Discount percentage is missing.",
      })
    }
  
    const updateDiscountQuery =
      "UPDATE discounts SET disc_name = ?, disc_percentage = ?, vehicle_id = ? WHERE disc_id = ?"
    const updateDiscountValues = [
      disc_name,
      disc_percentage,
      vehicle_id,
      discountId,
    ];
  
    const selectVehicleQuery =
      "SELECT vehicle_price FROM vehicles WHERE vehicle_id = ?"
    const selectVehicleValues = [vehicle_id]
  
    database.db.query(updateDiscountQuery, updateDiscountValues, (err, result) => {
      if (err) {
        return res.status(500).json({
          successful: false,
          message: err,
        })
      }
  
      database.db.query(
        selectVehicleQuery,
        selectVehicleValues,
        (err, vehicleResult) => {
          if (err) {
            return res.status(500).json({
              successful: false,
              message: err,
            });
          }
  
          if (vehicleResult.length > 0) {
            const originalPrice = vehicleResult[0].vehicle_price;
            const discountedPrice =
              originalPrice - (originalPrice * disc_percentage) / 100;
  
            const updateVehicleQuery =
              "UPDATE vehicles SET discount_price = ? WHERE vehicle_id = ?"
            const updateVehicleValues = [discountedPrice, vehicle_id];
  
            database.db.query(
              updateVehicleQuery,
              updateVehicleValues,
              (err, updateResult) => {
                if (err) {
                  return res.status(500).json({
                    successful: false,
                    message: err,
                  })
                }
  
                return res.status(200).json({
                  successful: true,
                  message: "Discount updated successfully!",
                  discountedPrice: discountedPrice,
                })
              }
            )
          } else {
            return res.status(400).json({
              successful: false,
              message: "Invalid vehicle_id. Vehicle not found.",
            });
          }
        }
      )
    })
}
const deleteDiscount = (req, res, next) => {
    const { discountId } = req.params
  
    const deleteDiscountQuery = "DELETE FROM discounts WHERE disc_id = ?"
    const deleteDiscountValues = [discountId]
  
    const selectDiscountQuery = "SELECT vehicle_id FROM discounts WHERE disc_id = ?"
    const selectDiscountValues = [discountId]
  
    database.db.query(selectDiscountQuery, selectDiscountValues, (err, result) => {
      if (err) {
        return res.status(500).json({
          successful: false,
          message: err,
        })
      }
  
      if (result.length > 0) {
        const vehicleId = result[0].vehicle_id;
  
        database.db.query(deleteDiscountQuery, deleteDiscountValues, (err, deleteResult) => {
          if (err) {
            return res.status(500).json({
              successful: false,
              message: err,
            })
          }
  
          const updateVehicleQuery = "UPDATE vehicles SET discount_price = vehicle_price WHERE vehicle_id = ?";
          const updateVehicleValues = [vehicleId];
  
          database.db.query(updateVehicleQuery, updateVehicleValues, (err, updateResult) => {
            if (err) {
              return res.status(500).json({
                successful: false,
                message: err,
              })
            }
  
            return res.status(200).json({
              successful: true,
              message: "Discount deleted successfully!",
            })
          })
        })
      } else {
        return res.status(400).json({
          successful: false,
          message: "Invalid discountId. Discount not found.",
        })
      }
    })
}
    

module.exports = {
  addDiscount,
  viewAllDiscounts,
  updateDiscount,
  deleteDiscount,
}
