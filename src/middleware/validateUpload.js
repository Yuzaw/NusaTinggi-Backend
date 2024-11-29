const validateUpload = (req, res, next) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'File tidak ditemukan.' });
  }

  const allowedTypes = ['application/json']; // Hanya izinkan file JSON
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ message: 'Tipe file tidak didukung. Hanya file JSON yang diizinkan.' });
  }

  if (file.size > 5 * 1024 * 1024) { // Maksimum ukuran file 5MB
    return res.status(400).json({ message: 'Ukuran file terlalu besar. Maksimum 5MB.' });
  }

  next();
};

module.exports = validateUpload;
