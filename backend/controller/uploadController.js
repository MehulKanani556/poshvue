/**
 * Upload Controller
 * Handles various file upload responses for AWS S3
 */

exports.uploadSingle = (req, res) => {
  try {
    // If S3 upload was successful, return the URL
    if (req.s3FileUrls && req.s3FileUrls.length > 0) {
      return res.status(200).json({
        success: true,
        url: req.s3FileUrls[0] // Return the first (and only) URL
      });
    }
    
    // If no S3 URLs but files were processed, return error
    return res.status(400).json({
      success: false,
      message: 'No file uploaded or upload failed'
    });
  } catch (error) {
    console.error('Upload controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};

exports.uploadMultiple = (req, res) => {
  try {
    // If S3 upload was successful, return the URLs
    if (req.s3FileUrls && req.s3FileUrls.length > 0) {
      return res.status(200).json({
        success: true,
        urls: req.s3FileUrls
      });
    }
    
    // If no S3 URLs but files were processed, return error
    return res.status(400).json({
      success: false,
      message: 'No files uploaded or upload failed'
    });
  } catch (error) {
    console.error('Upload controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};
