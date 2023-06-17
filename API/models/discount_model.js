const discModel = (name, percentage, vehicle_id) => {
    let discount = {
      disc_name: name,
      disc_percentage: percentage,
      vehicle_id: vehicle_id

    }
  
    return discount;
  }
  
  module.exports = {
    discModel
  }
  