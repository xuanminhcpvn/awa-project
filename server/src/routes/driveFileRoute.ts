import { validateToken, CustomRequest } from "../middleware/validateToken";
import { Response, Router } from "express"
import { DriveFile, IDriveFile } from "../models/DriveFile";
import { User, IUser } from "../models/User";
import mongoose, { Types } from "mongoose";

const router: Router = Router();
/* BASIC CRUD: */

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

//Soft-delete. Everyone has access to do that => not removing entry from db
router.patch("/:id/soft-delete", validateToken, async (req: CustomRequest, res: Response) => {
    const userId = req.user?.userId;
    const fileId = req.params.id;
    try {
        const file = await DriveFile.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        // allow owner OR editor OR viewer(?)
        const isOwner = file.ownerId.toString() === userId;
        // If converting ObjectId to string and compare it doesn't work we may have to use mongoose own equals() function https://mongoosejs.com/docs/api/document.html#Document.prototype.equals()
        const isAllowed = isOwner || file.editableUsers.map(id => id.toString()).includes(userId.toString()) || file.viewOnlyUsers.map(id => id.toString()).includes(userId.toString());
        if (!isAllowed) {
          return res.status(403).json({ message: "Permission denied" });
        }
        file.isSoftDeleted = true;
        file.softDeletedAt = new Date();
        await file.save();
        return res.status(200).json({ message: "Moved to trash" });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
//Permanent-delete => not showing to certain user. Only user can permanently delete
router.delete("/:id/permanent", validateToken, async (req: CustomRequest, res: Response) => {
    const userId = req.user?.userId;
    const fileId = req.params.id;
    try {
        const file: IDriveFile | null  = await DriveFile.findById(fileId);
        if (!file || file.isSoftDeleted) {
            return res.status(404).json({ message: "File not found" });
        }
        if (file.ownerId.toString() !== userId) {
            return res.status(403).json({ message: "Access denied, only owner can permanently delete" });//well the button only renders to owner so not really needed
        }
        await DriveFile.findByIdAndDelete(fileId);
        res.json({ message: "File deleted permanently" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Update info
router.put("/:id",validateToken, async (req: CustomRequest, res:Response) => {
    const driveFileId = req.params.id as string;
    //Possible body contents
    const contents: string | undefined = req.body.contents;
    const filename: string | undefined = req.body.filename;
    const isPublic: boolean | undefined = req.body.isPublic;
    const userId: string | undefined = req.user?.userId;

     try {
        const driveFile: IDriveFile | null = await DriveFile.findById(driveFileId);

        if (!driveFile || driveFile.isSoftDeleted) {
            return res.status(404).json({message: "File not found"});
        }

        //Check permissions
        const isOwner: boolean = driveFile.ownerId.toString() === userId;//Not sure if it is save to compare ObjectId with ===

        const canEdit: boolean = isOwner || driveFile.editableUsers.find((editableUserObjectId: Types.ObjectId): boolean =>editableUserObjectId.toString() === userId) !== undefined;
        
        //const canView: boolean = canEdit || driveFile.viewOnlyUsers.find((viewerObjectId: Types.ObjectId): boolean =>viewerObjectId.toString() === userId) !== undefined;

        if (!canEdit) {
            return res.status(403).json({message: "Access denied, no edit permission"});
        }
        //Locking mechanism preventing concurrent editing
        if (driveFile.currentlyUsedBy && driveFile.currentlyUsedBy.toString() !== userId) {
            const editingUser = await User.findById(driveFile.currentlyUsedBy) as IUser;
            return res.status(400).json({message: `File is currently being edited by ${editingUser.username}`});
        }
        
        if (contents !== undefined) {driveFile.contents = contents;} 
        if (filename !== undefined) {driveFile.filename = filename;}
        if (isPublic !== undefined) {driveFile.isPublic = isPublic;}
        if (userId) {driveFile.currentlyUsedBy = new Types.ObjectId(userId);}

        await driveFile.save();

        return res.status(200).json(driveFile);
        
    } catch (err) {
      return res.status(500).json({error: "Internal Server Error"});
    }

});


//Route to get user's info 
router.get("/me", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;