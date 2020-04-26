import multer from 'multer';
import path from 'path';

const dirPath = path.resolve(__dirname, '..', '..', 'temp');

export default {
  dir: dirPath,
  storage: multer.diskStorage({
    destination: dirPath,
    filename(req, file, callback) {
      const filename = `${Date.now()}-${file.originalname}`;

      return callback(null, filename);
    },
  }),
};
