const mysql = require('mysql')

//db details
//hostuser db name/schema, port (opt)

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "vehicle_db"
})

const connectDatabase = ()=>{
    db.connect((error)=>{
        if (error) {
            console.log("Error connecting to the Database.")
        }
        else {
            console.log("Successfully connected to the Database.")
        }
    })
}
module.exports = {
    db,
    connectDatabase
}