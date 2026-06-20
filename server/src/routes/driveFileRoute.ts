import { validateToken, CustomRequest } from "../middleware/validateToken";
import { Response, Router } from "express"
import { DriveFile, IDriveFile } from "../models/DriveFile";
import { User, IUser } from "../models/User";
import mongoose from "mongoose";

const router: Router = Router();
/* Create a new DriveFile for the authenticated user */
router.post("/", validateToken,async (req: CustomRequest, res: Response) => {
    const { filename, type } = req.body as IDriveFile;
    const userId = req.user?.userId;
    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }
    try {
      const user: IUser | null = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const newFile: IDriveFile = new DriveFile({
        ownerId: user._id,
        filename: filename,
        contents: "lorem ipsum",//can't be "" otherwise MongoDB won't save
        type: "text",
        isPublic: false,
      });
      console.log(newFile)
      await newFile.save();
      console.log(newFile);
      await user.save();
      return res.status(200).json(newFile);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
// Retrieve all files accessible to the authenticated user
// Group that can access => owner, allowed to edit and view-only
//  Returns sorted list of non-deleted files
router.get("/",validateToken,async (req: CustomRequest, res: Response) => {
    const userId = req.user?.userId;
    try {
        const files: IDriveFile[] = await DriveFile.find({
            isSoftDeleted: false,
            $or: [
            { ownerId: new mongoose.Types.ObjectId(userId) },
            { editableUsers: new mongoose.Types.ObjectId(userId) },
            { viewOnlyUsers: new mongoose.Types.ObjectId(userId) }
  ]
        }).sort({ updatedAt: -1 });
        return res.status(200).json(files);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
export default router;