
import express, { Request, Response, Router } from "express";
import { Types } from "mongoose";
import {DriveFile, IDriveFile} from "../models/DriveFile";
import { validateToken, CustomRequest } from "../middleware/validateToken";
import { IUser, User } from "../models/User";

const router: Router = Router();
//Single permission view
router.get("/:id", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const driveFileId = req.params.id as string;
        const userId: string | undefined = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const driveFile: IDriveFile | null = await DriveFile.findById(driveFileId);

        if (!driveFile) {
            return res.status(404).json({ error: "File not found" });
        }

        const isOwner: boolean = driveFile.ownerId.toString() === userId;
        const canEdit: boolean = isOwner || driveFile.editableUsers.find((editableUserObjectId: Types.ObjectId): boolean =>editableUserObjectId.toString() === userId) !== undefined
        const canView: boolean = canEdit || driveFile.viewOnlyUsers.find((viewerObjectId: Types.ObjectId): boolean =>viewerObjectId.toString() === userId) !== undefined;

        if (!canView) {
            return res.status(403).json({ error: "No permission to view this file" });
        }

        return res.status(200).json({
            file: {
                _id: driveFile._id,
                filename: driveFile.filename,
                contents: driveFile.contents,
            },
        });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
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
export default router;