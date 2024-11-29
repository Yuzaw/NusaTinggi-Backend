
const path = require('path');
const fs = require('fs');

const bucket = require('../config/cloudStorage');


exports.downloadNavigationFile = async (req, res) => {
  const { id: userId } = req.user; // Ambil ID dari token
  const { trailId } = req.params;

  const remoteFilePath = `navigation/${trailId}.json`;
  const localFilePath = path.join(__dirname, '../uploads', `${userId}_${trailId}.json`);

  try {
    const localDir = path.dirname(localFilePath);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    await bucket.file(remoteFilePath).download({ destination: localFilePath });

    console.log(`File ${remoteFilePath} berhasil diunduh ke ${localFilePath}`);

    res.download(localFilePath, `${trailId}.json`, (err) => {
      if (err) {
        console.error('Gagal mengirim file ke frontend:', err);
        res.status(500).json({ error: 'Gagal mengunduh file' });
      }

      fs.unlinkSync(localFilePath);
    });
  } catch (error) {
    console.error('Error saat mengunduh file dari bucket:', error);
    res.status(404).json({ error: 'File tidak ditemukan di bucket' });
  }
};


exports.duplicateFileToUser = async (req, res) => {
  const { id: userId } = req.user; // Ambil ID dari token
  const { trailId } = req.params;

  const sourceFilePath = `navigation/${trailId}.json`;
  const destinationFilePath = `users/userId-${userId}/navigation/${trailId}.json`;

  try {
    await bucket.file(sourceFilePath).copy(bucket.file(destinationFilePath));

    console.log(`File berhasil diduplikasi dari ${sourceFilePath} ke ${destinationFilePath}`);

    res.status(200).json({
      message: 'File berhasil diduplikasi.',
      source: sourceFilePath,
      destination: destinationFilePath,
    });
  } catch (error) {
    console.error('Error saat menduplikasi file:', error);
    res.status(500).json({
      message: 'Gagal menduplikasi file.',
      error: error.message,
    });
  }
};


exports.getTrailCoordinates = async (req, res) => {
  const { id: userId } = req.user; // Ambil ID dari token
  const { trailId } = req.params;

  const filePath = `users/userId-${userId}/navigation/${trailId}.json`;

  try {
    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({ message: 'File tidak ditemukan.' });
    }

    const [contents] = await file.download();
    const jsonData = JSON.parse(contents);

    res.status(200).json({ success: true, data: jsonData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan.' });
  }
};
