//1. import required libs and frameworks
import express, { Express } from "express";
import fs from "fs";
import path from "path";
import morgan from "morgan"; //Morgan is used to see request and response logs in terminal
import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv"; ////loads environment variables from a .env file into process.env at the sametime hides the secret contents from users and remote devs?
import cors, { CorsOptions } from "cors";
import { Request, Response } from "express";
import userRouter from "./src/routes/userRoute";
import filesRouter from "./src/routes/filesRoute";
import documentRoute from "./src/routes/documentRoute";
import imageRoute from "./src/routes/imageRoute";
//2. create Express application instance
dotenv.config();
const app: Express = express(); //this function must be on top;
const port: number = parseInt(process.env.BACK_END_PORT as string) || 1234;
//This would make static uploads should work in both dev + production
const uploadDir: string = path.join(process.cwd(), "uploads", "images");
fs.mkdirSync(uploadDir, { recursive: true });
const clientDistPath = path.resolve(__dirname, "../../client/dist");
const corsOptions: CorsOptions = {
    origin: `http://localhost:${process.env.FRONTEND_PORT}`,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));


app.use("/uploads", express.static(uploadDir));

//3. Link to database
const MongoDBBook: string = "mongodb://127.0.0.1:27017/testdb";
mongoose.connect(MongoDBBook);
mongoose.Promise = Promise; //Make mongoose use promise

const db: Connection = mongoose.connection; //4. Creating MongoDB database object
db.on("error", console.error.bind(console, "MongoDB connection error"));

//5. Middlewares
app.use(express.json()); //app can read JSON data sent from the client 
app.use(express.urlencoded({ extended: false })); // parse URL-encoded form data
app.use(morgan("dev")); //dev logs

//6. Routers
app.use("/api/user", userRouter);
app.use("/api/files", filesRouter);
app.use("/api/document", documentRoute);
app.use("/api/image", imageRoute);

//7. production / development routing behavior
//API routes MUST come BEFORE static fallback
if (process.env.NODE_ENV === "production") {

    //React build folder correctly
    app.use(express.static(clientDistPath));

    //Fallback. Course example get("*") is outdated
    app.get(/.*/, (req: Request, res: Response) => {
        res.sendFile(path.join(clientDistPath, "index.html"));
    });

} else if (process.env.NODE_ENV === "development") {
    // dev-only=>frontend runs separately (Vite/React dev server)
    const devCorsOptions: CorsOptions = {
        origin: `http://localhost:${process.env.FRONTEND_PORT}`,
        optionsSuccessStatus: 200
    };
    app.use(cors(devCorsOptions));
}
//9. Then the app must listen to certain port to communicate with other processes and nodes
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});