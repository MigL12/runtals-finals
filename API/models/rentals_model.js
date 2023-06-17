const RentalsModel = (RentName, RentDate, ReturnDate, vehicle_id, user_id) => {
    let rental = {
      rental_name: RentName,
      rental_date: RentDate,
      return_date: ReturnDate,
      vehicle_id: vehicle_id,
      user_id: user_id,
    }
  
    return rental;
  }
  
  module.exports = {
    RentalsModel
  }
  