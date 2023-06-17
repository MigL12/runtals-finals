const vehicle_model = (brand, model, type, yearmodel,price,quantity)=>{
    let vehicle = {
        vehicle_brand: brand,
        vehicle_model: model,
        vehicle_type: type,
        vehicle_yearmodel: yearmodel,
        vehicle_price: price,
        vehicle_quantity: quantity   
    }
    return vehicle
}
module.exports = {
    vehicle_model
}