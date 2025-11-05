const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg'];
// Thêm danh sách các file cần xử lý dạng raw
const rawFileExtensions = ['.xlsx', '.xls', '.doc', '.docx', '.ppt', '.pptx', '.pdf', '.json', '.txt', '.csv', '.xml'];


// Hàm xác định loại file và thư mục dựa vào đuôi file
const determineFolder = (req, file) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (imageExtensions.includes(extension)) {
    return 'Human Management/images';
  }
  return 'Human Management/files';
};

const determineResourceType = (req, file) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (rawFileExtensions.includes(extension)) {
      return 'raw';
    }
    return 'auto'; // Cloudinary sẽ tự phát hiện nếu là image hoặc video
  };

// Cấu hình storage với logic phân loại tự động
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: determineFolder,
      resource_type: determineResourceType,
      public_id: (req, file) => {
        const filename = path.parse(file.originalname).name;
        return `${filename}_${Date.now()}`;
      }
    }
  });

const uploadCloud = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn 10MB
});

// API đơn giản để tải lên một file
const upload = uploadCloud.single('file');

// API tải lên nhiều file
const uploadMultiple = uploadCloud.array('files', 10); // Tối đa 10 file

module.exports = { 
  upload, 
  uploadMultiple,
  
  // Hàm xóa file từ Cloudinary
  deleteFile: async (publicId) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return { success: true, result };
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      return { success: false, error: error.message };
    }
  }
};