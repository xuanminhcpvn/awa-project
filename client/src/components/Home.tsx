import { useEffect, useState } from "react";

interface IDriveFile {
    _id: string;
    filename: string;
    type: "text" | "spreadsheet" | "slide" | "image";
    updatedAt: string;
}

interface IUser {
    _id: string;
    username: string;
    email: string;
    image?: string;
}

const Home = () => {
    const [jwt, setJwt] = useState<string | null>(null);
    const [files, setFiles] = useState<IDriveFile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState<IUser | null>(null);

    useEffect(() => {
        if(localStorage.getItem("token")) {
            setJwt(localStorage.getItem("token"))
            setUser(JSON.parse(localStorage.getItem("user") || "null"))
        }
    }, [jwt])
    console.log(user);
    // GET files
    const fetchFiles = async () => {
        if (!jwt) return;  
        setLoading(true);
        try {
            const res = await fetch("/api/files", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                } 
            })

            if (!res.ok){
                throw new Error("Error while fetching files");
            } 

            const files: IDriveFile[] = await res.json();
            setFiles(files);
        } catch (err) {
            if (err instanceof Error) {
                console.log(`Error when trying to fetch files: ${err.message}`)
            }
        } finally {
            setLoading(false);
        }
    };

    // POST new file
    const createFile = async () => {
        if (!jwt) return;
        try {
            const res = await fetch("/api/files", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    filename: "Untilted file",
                    type: "text",
                }),
            });

            if(!res.ok) {
                throw new Error("Error while creating new file")
            }
            const newFile: IDriveFile = await res.json();
            console.log(newFile);
            fetchFiles();
        } catch (err) {
            console.log("POST error:", err);
        }
    };


    return (
    <div style={{ padding: "20px" }}>
        <h2>My Drive</h2>

        {!jwt ? (
            <p>Please login to fetch the files.</p>
        ) : (
            <>
                <button onClick={createFile}>+ New File</button>

                <button onClick={fetchFiles} style={{ marginLeft: "10px" }}>
                    Refresh
                </button>

                {loading && <p>Loading...</p>}

                <ul>
                    {files.map((file) => (
                        <li key={file._id}>
                            <strong>{file.filename}</strong> ({file.type}) —{" "}
                            {new Date(file.updatedAt).toLocaleString()}
                        </li>
                    ))}
                </ul>

                {files.length === 0 && !loading && <p>No files found</p>}
            </>
        )}
    </div>
    ); 
};

export default Home;