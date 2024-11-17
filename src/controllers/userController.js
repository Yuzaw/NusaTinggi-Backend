const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const users = require('../models/users'); //Database sementara

const SECRET_KEY = process.env.SECRET_KEY;

// Register
exports.register = async (req, res) => {
  const { username, email, password, gender, age } = req.body;
  const userExists = users.some((user) => user.username === username || user.email === email);

  if (userExists) {
    return res.status(400).json({ message: 'User with this username or email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, email, password: hashedPassword, gender, age });
  res.status(201).json({ message: 'User registered successfully' });
};

// Login
exports.login = async (req, res) => {
  const { username, email, password } = req.body;
  const user = users.find(
    (user) => user.username === username || user.email === email
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const accessToken = jwt.sign({ username: user.username, email: user.email }, SECRET_KEY, { expiresIn: '10m' });
  res.cookie('token', accessToken, { httpOnly: true, secure: true });
  res.status(200).json({ message: 'Login successful, token set in cookie' });
};

// Middleware untuk Verifikasi Token
exports.authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: 'Token not found' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Get Profile by Username
exports.getProfile = (req, res) => {
  const { username } = req.params; // Ambil username dari parameter route
  const user = users.find((user) => user.username === username);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({
    username: user.username,
    email: user.email,
    gender: user.gender,
    age: user.age
  });
};

exports.changePassword = async (req, res) => {
  const { username } = req.user; // Ambil username dari token setelah autentikasi
  const { oldPassword, newPassword } = req.body;

  // Cari user berdasarkan username
  const user = users.find((user) => user.username === username);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Periksa apakah password lama cocok
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Old password is incorrect' });
  }

  // Hash password baru
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword; // Update password user

  res.status(200).json({ message: 'Password updated successfully' });
};