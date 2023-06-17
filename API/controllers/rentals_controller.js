const RentalsModel = require('../models/rentals_model')
const database = require('../models/vehicleconnection_db')

//revisions: 


// Controller function to add a new rental
//add rental price x how may days wil be rented
//status canelled/reserved/available/returned
const addRental = (req, res) => {
  const rentName = req.body.rental_name
  const rentDate = req.body.rental_date
  const returnDate = req.body.return_date
  const vehicleId = req.body.vehicle_id
  const userId = req.body.user_id

  if (!rentName || !rentDate || !returnDate || !vehicleId || !userId) {
    return res.status(400).json({
      successful: false,
      message: 'One or more rental details are missing.',
    })
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(rentDate) || !dateRegex.test(returnDate)) {
    return res.status(400).json({
      successful: false,
      message: 'Invalid date format. Date should be in the format "YYYY-MM-DD".',
    })
  }

  // Validate rental date is not before the current date
  const currentDate = new Date().toISOString().split('T')[0];
  if (rentDate < currentDate) {
    return res.status(400).json({
      successful: false,
      message: 'Invalid rental date. Rental date cannot be in the past.',
    })
  }

  // Validate return date is within the next two weeks
  const maxReturnDate = new Date()
  maxReturnDate.setDate(maxReturnDate.getDate() + 14)
  const formattedMaxReturnDate = maxReturnDate.toISOString().split('T')[0]
  if (returnDate > formattedMaxReturnDate) {
    return res.status(400).json({
      successful: false,
      message: 'Invalid return date. Return date cannot exceed two weeks from now.',
    })
  }

  // Validate return date is not before the rental date
  if (returnDate < rentDate) {
    return res.status(400).json({
      successful: false,
      message: 'Invalid return date. Return date cannot be before the rental date.',
    })
  }

  // Calculate rent_price based on the interval between dates
  const interval = Math.ceil((new Date(returnDate) - new Date(rentDate)) / (1000 * 60 * 60 * 24))
  const rentPrice = interval * 1000 // Assuming the price increments by 1000 per day

  // Check if the vehicle_id and user_id exist in their respective tables
  const checkVehicleQuery = `SELECT * FROM vehicles WHERE vehicle_Id = ${vehicleId}`
  const checkUserQuery = `SELECT * FROM users WHERE user_id = ${userId}`

  database.db.query(checkVehicleQuery, (err, vehicleResult) => {
    if (err) {
      return res.status(500).json({
        successful: false,
        message: err,
      })
    }

    if (vehicleResult.length === 0) {
      return res.status(400).json({
        successful: false,
        message: 'Invalid vehicle_id. Vehicle not found.',
      })
    }

    database.db.query(checkUserQuery, (err, userResult) => {
      if (err) {
        return res.status(500).json({
          successful: false,
          message: err,
        })
      }

      if (userResult.length === 0) {
        return res.status(400).json({
          successful: false,
          message: 'Invalid user_id. User not found.',
        })
      }

      // Both vehicle_id and user_id are valid, insert the rental data into the rentals table
      const insertQuery = 'INSERT INTO rentals (rental_name, rental_date, return_date, vehicle_id, user_id, rent_price) VALUES (?, ?, ?, ?, ?, ?)'
      const rentalValues = [rentName, rentDate, returnDate, vehicleId, userId, rentPrice]

      database.db.query(insertQuery, rentalValues, (err, result) => {
        if (err) {
          return res.status(500).json({
            successful: false,
            message: err,
          })
        }

        // Decrement the quantity and update the vehicle status to "Rented"
        const updateVehicleQuery = `UPDATE vehicles SET vehicle_quantity = vehicle_quantity - 1, vehicle_status = 'Rented' WHERE vehicle_Id = ${vehicleId}`

        database.db.query(updateVehicleQuery, (err, updateResult) => {
          if (err) {
            return res.status(500).json({
              successful: false,
              message: err,
            })
          }

          return res.status(200).json({
            successful: true,
            message: 'Rental added successfully!',
          })
        })
      })
    })
  })
}

const returnRental = (req, res) => {
  const rentalId = req.params.rentalId

  const updateQuery = `
    UPDATE rentals
    SET rental_status = 'Returned'
    WHERE rental_id = ?
  `

  database.db.query(updateQuery, [rentalId], (err, result) => {
    if (err) {
      return res.status(500).json({
        successful: false,
        message: err,
      })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        successful: false,
        message: "Rental not found.",
      })
    }

    const updateVehicleQuery = `
      UPDATE vehicles
      SET vehicle_status = 'Available',
          vehicle_quantity = vehicle_quantity + 1
      WHERE vehicle_id = (
        SELECT vehicle_id
        FROM rentals
        WHERE rental_id = ?
      )
    `

    database.db.query(updateVehicleQuery, [rentalId], (err, vehicleResult) => {
      if (err) {
        return res.status(500).json({
          successful: false,
          message: err,
        })
      }

      if (vehicleResult.affectedRows === 0) {
        return res.status(404).json({
          successful: false,
          message: "Rental vehicle not found.",
        })
      }

      return res.status(200).json({
        successful: true,
        message: "Rental returned successfully!",
      })
    })
  })
}
//add get all rentals per user
// Controller function to get all rentals
const getAllRentals = (req, res) => {
    const query = `
      SELECT r.*, v.vehicle_price, d.disc_percentage
      FROM rentals r
      LEFT JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      LEFT JOIN discounts d ON r.vehicle_id = d.vehicle_id
    `
  
    database.db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({
          successful: false,
          message: err,
        })
      }
  
      const rentals = results.map((rental) => {
        const vehiclePrice = rental.vehicle_price
        const discountPercentage = rental.disc_percentage
  
        // Calculate the discounted price
        const discountedPrice = vehiclePrice * (1 - discountPercentage / 100);
  
        // Calculate the total amount by considering the discounted price and vehicle price
        const totalAmount = rental.total_amount || discountedPrice;
  
        // Return the modified rental object with the total amount
        return {
          ...rental,
          total_amount: totalAmount,
        }
      })
  
      return res.status(200).json({
        successful: true,
        rentals: rentals,
      })
    })
}
  // Controller function to update a rental
  //price ststus updaterental
const updateRental = (req, res) => {
    const rentalId = req.params.rentalId
    const rentalName = req.body.rental_name
    const rentalDate = req.body.rental_date
    const returnDate = req.body.return_date
    const vehicleId = req.body.vehicle_id
    const userId = req.body.user_id
  
    if (!rentalName || !rentalDate || !returnDate || !vehicleId || !userId) {
      return res.status(400).json({
        successful: false,
        message: 'One or more rental details are missing.',
      });
    }
  
    // Check if the rental exists in the database
    const checkRentalQuery = `SELECT * FROM rentals WHERE rental_id = ${rentalId}`;
    database.db.query(checkRentalQuery, (err, rentalResult) => {
      if (err) {
        return res.status(500).json({
          successful: false,
          message: err,
        })
      }
  
      if (rentalResult.length === 0) {
        return res.status(404).json({
          successful: false,
          message: 'Rental not found.',
        })
      }
  
      // Check if the vehicle_id and user_id exist in their respective tables
      const checkVehicleQuery = `SELECT * FROM vehicles WHERE vehicle_id = ${vehicleId}`;
      const checkUserQuery = `SELECT * FROM users WHERE user_id = ${userId}`;
  
      database.db.query(checkVehicleQuery, (err, vehicleResult) => {
        if (err) {
          return res.status(500).json({
            successful: false,
            message: err,
          })
        }
  
        if (vehicleResult.length === 0) {
          return res.status(400).json({
            successful: false,
            message: 'Invalid vehicle_id. Vehicle not found.',
          })
        }
  
        database.db.query(checkUserQuery, (err, userResult) => {
          if (err) {
            return res.status(500).json({
              successful: false,
              message: err,
            })
          }
  
          if (userResult.length === 0) {
            return res.status(400).json({
              successful: false,
              message: 'Invalid user_id. User not found.',
            })
          }
  
          // Both rental and related data exist, update the rental in the rentals table
          const updateQuery = `
            UPDATE rentals
            SET rental_name = ?, rental_date = ?, return_date = ?, vehicle_id = ?, user_id = ?
            WHERE rental_id = ?
          `
          const rentalValues = [rentalName, rentalDate, returnDate, vehicleId, userId, rentalId];
  
          database.db.query(updateQuery, rentalValues, (err, result) => {
            if (err) {
              return res.status(500).json({
                successful: false,
                message: err,
              })
            }
  
            // Update the vehicle status based on the rental status
            let vehicleStatus;
            if (rentalDate > Date.now() && returnDate > Date.now()) {
              // Rental is in the future
              vehicleStatus = 'Reserved';
            } else if (returnDate < Date.now()) {
              // Rental has already ended
              vehicleStatus = 'Returned';
            } else if (rentalResult[0].rental_status === 'Cancelled') {
              // Rental has been cancelled
              vehicleStatus = 'Cancelled';
            } else {
              // Rental is currently ongoing
              vehicleStatus = 'Available';
            }
  
            // Update the vehicle status in the vehicles table
            const updateVehicleQuery = `
              UPDATE vehicles
              SET vehicle_status = ?
              WHERE vehicle_id = ?
            `
            const vehicleValues = [vehicleStatus, vehicleId];
  
            database.db.query(updateVehicleQuery, vehicleValues, (err, result) => {
              if (err) {
                return res.status(500).json({
                  successful: false,
                  message: err,
                })
              }
  
              return res.status(200).json({
                successful: true,
                message: 'Rental updated successfully!',
              })
            })
          })
        })
      })
    })
}
  // Controller function to delete a rental
  //apply cancel rental here
  const deleteRental = (req, res) => {
    const rentalId = req.params.rentalId
  
    // Check if the rental exists
    const checkRentalQuery = `SELECT * FROM rentals WHERE rental_id = ${rentalId}`
  
    database.db.query(checkRentalQuery, (err, result) => {
      if (err) {
        return res.status(500).json({
          successful: false,
          message: err,
        })
      }
  
      if (result.length === 0) {
        return res.status(404).json({
          successful: false,
          message: 'Rental not found.',
        })
      }
  
      // Update the rental status to "cancelled"
      const updateQuery = `UPDATE rentals SET rental_status = 'cancelled' WHERE rental_id = ${rentalId}`;
  
      database.db.query(updateQuery, (err, result) => {
        if (err) {
          return res.status(500).json({
            successful: false,
            message: err,
          })
        }
  
        return res.status(200).json({
          successful: true,
          message: 'Rental cancelled successfully!',
        })
      })
    })
  }

const getRentalPerUser = (req, res) => {
    const userId = req.params.userId;
  
    const query = `
      SELECT r.*, v.vehicle_price, d.disc_percentage
      FROM rentals r
      LEFT JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      LEFT JOIN discounts d ON r.vehicle_id = d.vehicle_id
      WHERE r.user_id = ?
    `
  
    database.db.query(query, [userId], (err, results) => {
      if (err) {
        return res.status(500).json({
          successful: false,
          message: err,
        })
      }
  
      if (results.length === 0) {
        return res.status(404).json({
          successful: false,
          message: "No rentals found for the specified user ID.",
        })
      }
  
      const rental = results[0];
      const vehiclePrice = rental.vehicle_price;
      const discountPercentage = rental.disc_percentage;
  
      // Calculate the discounted price
      const discountedPrice = vehiclePrice * (1 - discountPercentage / 100);
  
      // Calculate the total amount by considering the discounted price and vehicle price
      const totalAmount = rental.total_amount || discountedPrice;
  
      // Return the rental object with the total amount
      const rentalWithTotalAmount = {
        ...rental,
        total_amount: totalAmount,
      }
  
      return res.status(200).json({
        successful: true,
        rental: rentalWithTotalAmount,
      })
    })
}
  
  
module.exports = {
  addRental,
  getAllRentals,
  updateRental,
  deleteRental,
  getRentalPerUser,
  returnRental
}
