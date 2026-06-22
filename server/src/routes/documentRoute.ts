
import { Response, Router } from "express";
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
            _id: driveFile._id,
            filename: driveFile.filename,
            contents: driveFile.contents,
            canEdit: canEdit,
            canView: canView
        });

    } catch (error) {
        console.error(error);
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
        if (!canEdit) {
            return res.status(403).json({message: "Access denied, no edit permission"});
        }
        //Lock preventing concurrent editing
        if (driveFile.currentlyUsedBy && driveFile.currentlyUsedBy.toString() !== userId) {
            const editingUser = await User.findById(driveFile.currentlyUsedBy) as IUser;
            return res.status(400).json({message: `File is currently being edited by ${editingUser.username}`});
        }
        
        if (contents !== undefined) {driveFile.contents = contents;} 
        if (filename !== undefined) {driveFile.filename = filename;}
        if (isPublic !== undefined) {driveFile.isPublic = isPublic;}
        if (userId) {driveFile.currentlyUsedBy = new Types.ObjectId(userId);}

        await driveFile.save();
        console.log(canEdit);
        return res.status(200).json({
            _id: driveFile._id,
            filename: driveFile.filename,
            contents: driveFile.contents,
            canEdit: canEdit
        });
        
    } catch (err) {
      console.error(err);
      return res.status(500).json({error: "Internal Server Error"});
    }

});

//For locking mechanisms
//acquire lock
router.post("/:id/lock", validateToken, async (req: CustomRequest, res: Response) => {

    try {
        const driveFileId = req.params.id as string;
        const userId: string | undefined = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const driveFile: IDriveFile | null = await DriveFile.findById(driveFileId);

        if (!driveFile || driveFile.isSoftDeleted) {
            return res.status(404).json({ error: "File not found" });
        }

        //Lock timeout (10 min) => prevent stale lock
        if (driveFile.currentlyUsedBy && driveFile.lockedAt) {

            const diff = Date.now() - new Date(driveFile.lockedAt).getTime();

            if (diff > 10 * 60 * 1000) {
                driveFile.currentlyUsedBy = null;
                driveFile.lockedAt = null;
            }
        }

        //locked by someone
        if (driveFile.currentlyUsedBy && driveFile.currentlyUsedBy.toString() !== userId) {
            return res.status(409).json({
                success: false,
                message: "Document is locked by another user"
            });
        }

        //acquire lock
        driveFile.currentlyUsedBy = new Types.ObjectId(userId);
        driveFile.lockedAt = new Date();

        await driveFile.save();

        return res.status(200).json({
            success: true,
            lockedBy: userId
        });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/:id/unlock", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const driveFileId = req.params.id as string;
        const userId = req.user?.userId as string;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const drivefile: IDriveFile | null = await DriveFile.findById(driveFileId);

        if (!drivefile) {
            return res.status(404).json({ error: "File not found" });
        }

        // only owner of lock can unlock
        if (drivefile.currentlyUsedBy?.toString() !== userId) {
            return res.status(403).json({ error: "Cannot lock owner" });
        }
        drivefile.currentlyUsedBy = null;
        drivefile.lockedAt = null;
        await drivefile.save();
        return res.status(200).json({success: true});
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/:id/lock-info", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const driveFileId = req.params.id as string;

        const driveFile: IDriveFile | null = await DriveFile.findById(driveFileId);

        if (!driveFile) {
            return res.status(404).json({ error: "File not found" });
        }

        let isLocked = false;
        let lockedBy = null;

        //Lock timeout (10 min) => prevent stale lock
        if (driveFile.currentlyUsedBy && driveFile.lockedAt) {

            const diff = Date.now() - new Date(driveFile.lockedAt).getTime();

            if (diff > 10 * 60 * 1000) {
                driveFile.currentlyUsedBy = null;
                driveFile.lockedAt = null;
                await driveFile.save();
            }
        }

        if (driveFile.currentlyUsedBy) {
            isLocked = true;
            lockedBy = driveFile.currentlyUsedBy;
        }

        return res.status(200).json({
            isLocked,
            lockedBy
        });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
export default router;