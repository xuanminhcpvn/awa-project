import { Router,Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {User, IUser} from "../models/User";
import { CustomRequest, validateToken } from "../middleware/validateToken";
import upload from "../middleware/multer-config";
import path from "path"
import fs from "fs"
const router: Router = Router();

router.post("/register", upload.single("image"), async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body as IUser;

        if (!username || !password || !email) {
            return res.status(400).json({ message: "username, email and password required" });
        }

        const existingUser: IUser | null = await User.findOne({ username });

        if (existingUser) {
            return res.status(403).json({ message: "User already exists" });
        }

        const hashedPassword: string = await bcrypt.hash(password, 10);
        const imageFilename: string | null = req.file ? req.file.filename : null;

        const newUser: IUser = new User({   
            username,
            email,
            password: hashedPassword,
            imageId: imageFilename
        });

        await newUser.save();

        return res.status(200).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("Error while trying to :", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/login", async (req:Request, res:Response) => {
    try {
        const { username, password } = req.body as IUser;
        if (!username || !password) {
            return res.status(400).json({ message: "username and password required" });
        }
        const user: IUser | null = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "user not found" });
        }
        //hash
        const validPassword:boolean = await bcrypt.compare(password, user.password);
        if (!validPassword){
            return res.status(401).json({ message: "Invalid usernames or password" });
        }
        //JWT
        const token:string = jwt.sign({ userId: user._id },process.env.JWT_SECRET as string,{ expiresIn: "1h" });
        
        return res.status(200).json({success: true, token})
    } catch (err:any) {
        console.error(`Error: ${err}`);
        return res.status(500).json({error: "Internal Server Error"})
    }
});

/* Proected route test*/

router.get("/me", validateToken, async (req: CustomRequest, res:Response) => {
    try {
        const user = await User.findById(req.user?.userId).select("-password")
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error:any ) {
        console.error("Error while accessing protected route:", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
});
router.post("/profile-image", validateToken, upload.single("image"), async (req: CustomRequest, res: Response) => {
    try {
        const userId:string | null = req.user?.userId;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const user: IUser | null = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        //Deleting old file from the local file system
        if (user.imageId) {
            const oldPath = path.join(process.cwd(),"uploads","images",user.imageId);

            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        user.imageId = req.file.filename;
        await user.save();
        return res.status(200).json({filename: req.file.filename});

        } catch (error) {
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
);
export default router;