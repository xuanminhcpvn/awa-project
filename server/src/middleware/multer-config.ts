import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/images");
    },

    filename: (req, file, cb) => {
        const originalName = file.originalname;

        const extension = path.extname(originalName);

        const namePart = path.basename(originalName, extension);

        const id = uuidv4();

        const filename = `${namePart}_${id}${extension}`;

        cb(null, filename);
    }
});

const upload = multer({ storage });

export default upload;