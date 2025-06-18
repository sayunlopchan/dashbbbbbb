const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);
  } else {
    console.log(`Uploads directory already exists: ${uploadsDir}`);
  }
} catch (error) {
  console.error('Error creating uploads directory:', error);
  throw error;
}

// Configure multer to store files on disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(`Setting destination for file: ${file.originalname} to ${uploadsDir}`);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = 'event-' + uniqueSuffix + ext;
    console.log(`Generated filename: ${filename} for ${file.originalname}`);
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  console.log(`Processing file: ${file.originalname} with mimetype: ${file.mimetype}`);
  
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    console.log(`File rejected: ${file.originalname} - not an image file`);
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  
  console.log(`File accepted: ${file.originalname}`);
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Export the configured multer instance
module.exports = upload; 