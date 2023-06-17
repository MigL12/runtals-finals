  const UserModel = require('../models/user_model')
  const database = require('../models/vehicleconnection_db')
  const bcrypt = require('bcrypt');
  const passwordValidator = require('password-validator');

  //revisions: 

  //ADD NEW USER
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email);
  }
  
  const addUser = (req, res, next) => {
    const { name, password, email, birthdate } = req.body
  
    if (!name || !password || !email || !birthdate) {
      res.status(400).json({
        successful: false,
        message: 'User information is undefined or blank.',
      })
    } else if (!validateEmail(email)) {
      res.status(400).json({
        successful: false,
        message: 'Invalid email format.',
      })
    } else {
      const passwordValidator = require('password-validator');
      const schema = new passwordValidator();
  
      // Set password requirements
      schema
        .is().min(8) // Minimum length 8
        .has().uppercase() // Must have uppercase letters
        .has().lowercase() // Must have lowercase letters
        .has().digits() // Must have digits
  
      if (!schema.validate(password)) {
        res.status(400).json({
          successful: false,
          message: 'Password must have at least 8 characters, one uppercase letter, one lowercase letter, and at least one digit.',
        })
      } else {
        const selectQuery = 'SELECT * FROM users WHERE user_email = ?';
        const values = [email];
  
        database.db.query(selectQuery, values, (err, rows) => {
          if (err) {
            console.error(err)
            res.status(500).json({
              successful: false,
              message: 'Error occurred while querying the database.',
            })
          } else {
            if (rows.length > 0) {
              res.status(409).json({
                successful: false,
                message: 'User with the provided email already exists.',
              })
            } else {
              // Generate a salt for password hashing
              const saltRounds = 10;
              bcrypt.genSalt(saltRounds, (err, salt) => {
                if (err) {
                  console.error(err);
                  res.status(500).json({
                    successful: false,
                    message: 'Error occurred while generating salt.',
                  })
                } else {
                  // Hash the password using the generated salt
                  bcrypt.hash(password, salt, (err, hashedPassword) => {
                    if (err) {
                      console.error(err)
                      res.status(500).json({
                        successful: false,
                        message: 'Error occurred while hashing password.',
                      })
                    } else {
                      const insertQuery = 'INSERT INTO users SET ?'
                      const userObj = UserModel.userModel(name, hashedPassword, email, birthdate);
  
                      database.db.query(insertQuery, userObj, (err) => {
                        if (err) {
                          console.error(err)
                          res.status(500).json({
                            successful: false,
                            message: 'Error occurred while adding a new user.',
                          })
                        } else {
                          res.status(200).json({
                            successful: true,
                            message: 'Successfully added a new user!',
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
          }
        })
      }
    }
  }
  
  const viewUserById = (req, res, next) => {
    const { id } = req.params
  
    const query = 'SELECT user_id, user_name, user_email, user_birthdate FROM users WHERE user_id = ?'
    const values = [id]
  
    database.db.query(query, values, (err, rows) => {
      if (err) {
        console.error(err)
        res.status(500).json({
          successful: false,
          message: 'Error occurred while retrieving the user.',
        })
      } else if (rows.length === 0) {
        res.status(404).json({
          successful: false,
          message: 'User not found.',
        })
      } else {
        const user = rows[0]
        const birthdate = user.user_birthdate
        const age = calculateAge(birthdate)
  
        res.status(200).json({
          successful: true,
          user: {
            ...user,
            user_age: age,
          },
        })
      }
    })
  }
  
  // Helper function to calculate age based on birthdate
  function calculateAge(birthdate) {
    const currentDate = new Date()
    const birthDate = new Date(birthdate)
  
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDifference = currentDate.getMonth() - birthDate.getMonth();
  
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && currentDate.getDate() < birthDate.getDate())
    ) {
      age--
    }
  
    return age
  }
  
  // VIEW USERS
  const viewUsersDetails = (req, res, next) => {
    const query = 'SELECT user_id, user_name, user_email, user_birthdate FROM users';
  
    database.db.query(query, (err, rows) => {
      if (err) {
        res.status(500).json({
          successful: false,
          message: err,
        });
      } else {
        const usersWithAge = rows.map(user => {
          const birthdate = user.user_birthdate;
          const age = calculateAge(birthdate);
  
          return {
            ...user,
            user_age: age,
          }
        })
  
        res.status(200).json({
          successful: true,
          users: usersWithAge,
        })
      }
    })
  }
  
  //hiwalay password 
  // UPDATE USER DETAILS
  const updateUser = (req, res, next) => {
    const { id } = req.params
    const { name, email } = req.body

    if (!name || !email) {
        res.status(400).json({
            successful: false,
            message: 'Missing required fields.',
        })
    } else if (!validateEmail(email)) {
        res.status(400).json({
            successful: false,
            message: 'Invalid email format.',
        })
    } else {
        const updateQuery = 'UPDATE users SET user_name = ?, user_email = ? WHERE user_id = ?'
        const updateValues = [name, email, id];

        database.db.query(updateQuery, updateValues, (err, result) => {
            if (err) {
                console.error(err)
                res.status(500).json({
                    successful: false,
                    message: 'Error occurred while updating the user.',
                })
            } else if (result.affectedRows === 0) {
                res.status(404).json({
                    successful: false,
                    message: 'User not found.',
                })
            } else {
                res.status(200).json({
                    successful: true,
                    message: 'User updated successfully.',
                })
            }
        })
    }
}
const deleteUser = (req, res, next) => {
  const { id } = req.params

  const selectQuery = 'SELECT * FROM users WHERE user_id = ?'
  const deleteQuery = 'DELETE FROM users WHERE user_id = ?'
  const archiveQuery = 'INSERT INTO archived_users (user_id, user_name, user_email) VALUES (?, ?, ?)'

  database.db.query(selectQuery, id, (err, rows) => {
      if (err) {
          console.error(err)
          res.status(500).json({
              successful: false,
              message: 'Error occurred while retrieving the user.',
          })
      } else if (rows.length === 0) {
          res.status(404).json({
              successful: false,
              message: 'User not found.',
          })
      } else {
          const user = rows[0]

          database.db.beginTransaction((err) => {
              if (err) {
                  console.error(err)
                  res.status(500).json({
                      successful: false,
                      message: 'Error occurred while starting the transaction.',
                  });
              } else {
                  database.db.query(deleteQuery, id, (err, result) => {
                      if (err) {
                          database.db.rollback(() => {
                              console.error(err);
                              res.status(500).json({
                                  successful: false,
                                  message: 'Error occurred while deleting the user.',
                              })
                          })
                      } else if (result.affectedRows === 0) {
                          res.status(404).json({
                              successful: false,
                              message: 'User not found.',
                          })
                      } else {
                          database.db.query(archiveQuery, [user.user_id, user.user_name, user.user_email], (err, result) => {
                              if (err) {
                                  database.db.rollback(() => {
                                      console.error(err);
                                      res.status(500).json({
                                          successful: false,
                                          message: 'Error occurred while archiving the user.',
                                      })
                                  })
                              } else {
                                  database.db.commit((err) => {
                                      if (err) {
                                          database.db.rollback(() => {
                                              console.error(err)
                                              res.status(500).json({
                                                  successful: false,
                                                  message: 'Error occurred while committing the transaction.',
                                              })
                                          })
                                      } else {
                                          res.status(200).json({
                                              successful: true,
                                              message: 'User moved to the archive successfully.',
                                          })
                                      }
                                  })
                              }
                          })
                      }
                  })
              }
          })
      }
  })
}

  const login =  async(req, res, next) => {
      // const email = req.body.user_email
       //const password = req.body.user_password
     const {email,password}= req.body
       if (!email || !password ) {
         res.status(400).json({
           successful: false,
           message: "Email or password is missing."
         })
       } else {
         // Perform SELECT query to retrieve user details
         const selectQuery = `SELECT * FROM users WHERE user_email = '${email}'`
         database.db.query(selectQuery, async (err, rows,) => {
           if (err) {
             res.status(500).json({
               successful: false,
               message: err
             })
           } else {
             if (rows.length > 0) {
               const storedPassword = rows[0].user_password
               if(await bcrypt.compare(password,storedPassword)){
                 res.status(200).json({
                   successful: true,
                   message: "Successfully logged in"
                 })
                }
                else{
                 res.status(400).json({
                   successful: false,
                   message: "Incorrect credentials"
                 })
                }
              
                 } 
             
           }
         })
       }
  }
  const changePassword = (req, res, next) => {
    const { id } = req.params
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        res.status(400).json({
            successful: false,
            message: 'Missing required fields.',
        })
    } else if (oldPassword === newPassword) {
        res.status(400).json({
            successful: false,
            message: 'New password must be different from the old password.',
        })
    } else {
        // Retrieve the user's current password from the database
        const selectQuery = 'SELECT user_password FROM users WHERE user_id = ?';
        const selectValues = [id];

        database.db.query(selectQuery, selectValues, (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({
                    successful: false,
                    message: 'Error occurred while querying the database.',
                })
            } else if (rows.length === 0) {
                res.status(404).json({
                    successful: false,
                    message: 'User not found.',
                })
            } else {
                const currentPassword = rows[0].user_password;

                // Compare the old password with the current password
                bcrypt.compare(oldPassword, currentPassword, (err, isMatch) => {
                    if (err) {
                        console.error(err)
                        res.status(500).json({
                            successful: false,
                            message: 'Error occurred while comparing passwords.',
                        })
                    } else if (!isMatch) {
                        res.status(400).json({
                            successful: false,
                            message: 'Invalid old password.',
                        })
                    } else {
                        // Validate the new password
                        const schema = new passwordValidator()
                        schema
                            .is().min(8)
                            .is().max(100)
                            .has().uppercase()
                            .has().lowercase()
                            .has().digits()
                            .has().not().spaces()

                        if (!schema.validate(newPassword)) {
                            res.status(400).json({
                                successful: false,
                                message: 'Invalid new password format.',
                            })
                        } else {
                            // Generate a salt for password hashing
                            const saltRounds = 10;
                            bcrypt.genSalt(saltRounds, (err, salt) => {
                                if (err) {
                                    console.error(err)
                                    res.status(500).json({
                                        successful: false,
                                        message: 'Error occurred while generating salt.',
                                    })
                                } else {
                                    // Hash the new password using the generated salt
                                    bcrypt.hash(newPassword, salt, (err, hashedPassword) => {
                                        if (err) {
                                            console.error(err);
                                            res.status(500).json({
                                                successful: false,
                                                message: 'Error occurred while hashing password.',
                                            })
                                        } else {
                                            const updateQuery = 'UPDATE users SET user_password = ? WHERE user_id = ?'
                                            const updateValues = [hashedPassword, id];

                                            database.db.query(updateQuery, updateValues, (err, result) => {
                                                if (err) {
                                                    console.error(err)
                                                    res.status(500).json({
                                                        successful: false,
                                                        message: 'Error occurred while changing the user password.',
                                                    })
                                                } else if (result.affectedRows === 0) {
                                                    res.status(404).json({
                                                        successful: false,
                                                        message: 'User not found.',
                                                    })
                                                } else {
                                                    res.status(200).json({
                                                        successful: true,
                                                        message: 'User password changed successfully.',
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    }
                })
            }
        })
    }
}

  module.exports = {
    addUser,
    viewUsersDetails,
    viewUserById,
    updateUser,
    changePassword,
    deleteUser,
    login
  }
  