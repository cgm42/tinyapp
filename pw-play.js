
const bcrypt = require('bcryptjs');
// const salt =  bcrypt.genSaltSync(10);
// console.log('salt :>> ', salt);
let password = "peach";
console.log('password :>> ', password);

const salt = 'tomlei90@gmail.com'
  // bcrypt.genSalt(10, (err, salt) => {
  //   console.log('salt :>> ', salt);
  bcrypt.hash(password, salt, (err, hash) => {
    const hashedPassword = hash;
    console.log('hashedPassword :>> ', hashedPassword);
  })
  bcrypt.hash(password, salt, (err, hash) => {
    const hashedPassword = hash;
    console.log('hashedPassword :>> ', hashedPassword);
  })
  // });

  // bcrypt.genSalt(10)
  //   .then((salt) => {
  //     console.log('salt :>> ', salt);
  //     return bcrypt.hash(password, salt)
  //   })
  //   .then((hash) => {
  //     const hashedPassword = hash;
  //     console.log('hashedPassword :>> ', hashedPassword);
  //   })
