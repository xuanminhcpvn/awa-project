import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface IDriveFile {
    _id: string;
    ownerId: string
    filename: string;
    type: "text" | "spreadsheet" | "slide" | "image";
    createdAt: string,
    updatedAt: string;
    isPublic: boolean;
    shareLink: string;
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

    const [sortBy, setSortBy] = useState<string>("name");
    
    const navigate = useNavigate();
    //Updated state control to set jtw token once and fetch everything else when jwt is set or refreshed
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setJwt(token);
        }
    }, []);

    useEffect(() => {
        if (!jwt){
            return;
        }
        fetchMe();
        fetchFiles();
    }, [jwt]);
    
    // GET files
    const fetchFiles = async () => {
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
        // Ask user for filename
        const enteredFileName: string | null = prompt("Enter file name:");
        // If user cancels or enters empty name, stop creation
        if (!enteredFileName || enteredFileName.trim() === "") {
            alert("File name is required!");
            return;
        }
        try {
            const res = await fetch("/api/files", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    filename: enteredFileName.trim(), // use user input
                    type: "text",
                }),
            });

            if (!res.ok) {
                throw new Error("Error while creating new file");
            }
            // Refresh file list after creation
            fetchFiles();

        } catch (err) {
            console.log("error:", err);
        }
    };

    const softDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/files/${id}/soft-delete`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${jwt}`
                }
            });

            if (!res.ok) {
                throw new Error("Soft delete failed");
            }

            fetchFiles();
        } catch (err) {
            console.log(err);
        }
    };

    const permanentDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/files/${id}/permanent-delete`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${jwt}`
                }
            });
            if (!res.ok) {
                throw new Error("Permanent delete failed");
            }
            fetchFiles();
        } catch (err) {
            console.log(err);
        }
    };
    // Rename file
    const handleRename = async (fileId: string) => {
        const newFileName: string | null = prompt("Enter new file name:");

        if (!newFileName) {
            alert("File name cannot be empty!");
            return;
        }

        try {
            const res = await fetch(`/api/document/${fileId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    filename: newFileName
                })
            });
            if (!res.ok) {
                throw new Error("Failed to rename file");
            }
            // refresh list
            fetchFiles();
        } catch (err) {
            console.log("Rename error:", err);
            alert("Rename failed");
        }
    };
    const handleShare = async (driveFileId: string, shareType: "edit" | "view") => {
        const email: string | null = prompt(`Enter the email address to grant ${shareType} access:`);
        if (!email) {
            return;
        }
        try {
            const route: string = shareType === "edit" ? `/api/files/${driveFileId}/editor` : `/api/files/${driveFileId}/viewer`;
            const res: Response = await fetch(route, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify({email: email})
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Share failed");
            }
            
            alert(`${shareType === "edit" ? "Editor" : "Viewer"} access granted successfully`);

    } catch (err) {
        if (err instanceof Error) {
            alert(err.message);
        }
    }
    };

    const togglePublic = async (driveFileId: string, currentState: boolean) => {
        try {
            const res = await fetch(`/api/files/${driveFileId}/visibility`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({ isPublic: !currentState }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed");
            }

            setFiles((previousFilesList: IDriveFile[]) =>previousFilesList.map((fileItem: IDriveFile) => { const isTargetFileBeingUpdated: boolean = fileItem._id === driveFileId; // Check if this file matches the file we want to update
                return isTargetFileBeingUpdated
                ? {
                    ...fileItem, // Keep all existing file properties unchanged
                    isPublic: data.isPublic, // Update only the isPublic field with new value
                    shareLink: data.shareLink
                } : fileItem; // If not the target file, return it unchanged
            }));

        } catch (err) {
            alert(err instanceof Error ? err.message : "Error");
        }
    };

    const fetchMe = async () => {
        try {
            const res = await fetch("/api/user/me", {
                headers: {
                    "Authorization": `Bearer ${jwt}`
                }
            });

            if (!res.ok) {
                throw new Error("Failed to fetch user");
            }

            const user = await res.json();
            setUser(user);
        } catch (err) {
            console.log(err);
        }
    };

    const copyLink = (driveFile: IDriveFile) => {
        if (!driveFile.isPublic) {
            alert("Make file public first");
            return;
        }

        const link = `${window.location.origin}/document/public/${driveFile.shareLink}`;
        navigator.clipboard.writeText(link);
        alert("Link copied!");
    };

    const formatDate = (dateInput: string) => {
        const date: Date = new Date(dateInput);
        const day:string = String(date.getDate()).padStart(2, "0");
        const month:string = String(date.getMonth() + 1).padStart(2, "0");
        const year:string = String(date.getFullYear());
        return `${day}.${month}.${year}`;
    };

    const sortedFiles: IDriveFile[] = [...files].sort((a: IDriveFile, b: IDriveFile): number => {
        //Note
        if (sortBy === "name") {
            return a.filename.localeCompare(b.filename);
        }

        if (sortBy === "createdAt") {
            return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        if (sortBy === "updatedAt") {
            return (new Date(b.updatedAt).getTime() -new Date(a.updatedAt).getTime());
        }

        return 0;
    }
    );
    //basic UI (see previous git commit) is done by me
    //I used chatGPT to refine UI
    return (
        <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
            <h2>My Drive</h2>
            {!jwt ? (
                <p>Please login to fetch the files.</p>
            ) : (
                <>
                    {/* Top buttons */}
                    <div style={{ marginBottom: "20px" }}>
                        <button onClick={createFile} style={{ marginRight: "10px" }}>New File</button>
                        <button onClick={fetchFiles}>Refresh</button>
                        {/* Sort dropdown*/}
                        <label>Sort By: </label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="name">Name</option>
                            <option value="createdAt">Created Date</option>
                            <option value="updatedAt">Last Updated</option>
                        </select>
                    </div>
                    {loading && <p>Loading...</p>}
                    {sortedFiles.map((file) => {
                        const isOwner: boolean = user?._id === file.ownerId;
                        return (
                            <div
                                key={file._id}
                                style={{
                                    border: "1px solid #ccc",
                                    borderRadius: "8px",
                                    padding: "15px",
                                    marginBottom: "15px"
                                }}
                            >
                                {/* File Info */}
                                <div style={{ marginBottom: "10px" }}>
                                    <strong style={{ fontSize: "18px" }}>Filename: {file.filename}</strong>
                                    <div>Type: {file.type}</div>
                                    <div>Created: {formatDate(file.createdAt)}</div>
                                    <div>Updated: {formatDate(file.updatedAt)}</div>
                                    <div>
                                        {file.isPublic ? "Public" : "Private"}
                                    </div>
                                </div>
                                {/* Buttons modifying file  */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    <button onClick={() => navigate(`/document/edit/${file._id}`)}>Edit</button>
                                    <button onClick={() => navigate(`/document/view/${file._id}`)}>View</button>
                                    <button onClick={() => handleRename(file._id)}>Rename</button>
                                    {!isOwner && (<button data-testid="cypress-soft-delete-btn" onClick={() => softDelete(file._id)}>Delete</button>)}
                                    {isOwner && (
                                        <>
                                            <button onClick={() => handleShare(file._id, "edit")}>Share Edit</button>
                                            <button onClick={() => handleShare(file._id, "view")}>Share View</button>
                                            <button onClick={() =>togglePublic(file._id, file.isPublic)}>{file.isPublic? "Make Private": "Make Public"}</button>
                                            {file.isPublic && (<button onClick={() => copyLink(file)}>Copy Public Link</button>)}
                                            <button onClick={() => permanentDelete(file._id)} style={{ color: "red" }}>Delete Permanently</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {files.length === 0 && !loading && (
                        <p>No files found</p>
                    )}
                </>
            )}
        </div>
    );
};

export default Home;