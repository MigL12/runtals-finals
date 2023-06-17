const express = require('express')
const userController = require('../controllers/user_controller')

const userRouter = express.Router()

userRouter.post('/addU', userController.addUser)
userRouter.get('/viewU', userController.viewUsersDetails)
userRouter.get('/viewUid/:id', userController.viewUserById)
userRouter.put('/updateU/:id', userController.updateUser)
userRouter.put('/changeP/:id',userController.changePassword)
userRouter.delete('/deleteU/:id',userController.deleteUser)
userRouter.post('/login',userController.login)

module.exports = userRouter 

