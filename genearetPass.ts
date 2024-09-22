import bcrypt from 'bcryptjs';

const password = 'admin';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) throw err;
  console.log(hash); // Use this hash in your .env file
});
