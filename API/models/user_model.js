const userModel = (name, password, email, birthdate) => {
  return {
    user_name: name,
    user_password: password,
    user_email: email,
    user_birthdate: birthdate,
  };
};

module.exports = {
  userModel,
};
