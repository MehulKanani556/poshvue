require('dotenv').config();
const express = require('express');
const { uploadReviewImages, uploadToS3 } = require('./middleware/upload');

const app = express();

// Test route to debug upload
app.post('/test-upload', uploadReviewImages, uploadToS3, (req, res) => {
  console.log('Request files:', req.files);
  console.log('S3 URLs:', req.s3FileUrls);
  
  if (req.s3FileUrls && req.s3FileUrls.length > 0) {
    res.json({ 
      success: true, 
      message: 'Upload successful',
      urls: req.s3FileUrls 
    });
  } else {
    res.json({ 
      success: false, 
      message: 'No files uploaded',
      files: req.files,
      s3Urls: req.s3FileUrls
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test with: curl -X POST -F "images=@test.png" http://localhost:5001/test-upload');
});
