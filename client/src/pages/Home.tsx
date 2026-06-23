import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchSortTool from "../components/SearchSortTool";
import PaginationTool from "../components/PaginationTool";

interface IDriveFile {
    _id: string;
    ownerId: string
    filename: string;
    type: "text" | "spreadsheet" | "slide" | "image";
    createdAt: string,
    updatedAt: string;
    isPublic: boolean;
    isSoftDeleted: string,
    softDeletedAt: string,
    shareLink: string;
}

interface IUser {
    _id: string;
    username: string;
    email: string;
    imageId?: string | null;
    imageUrl?: string;
}

const Home = () => {
    const [jwt, setJwt] = useState<string | null>(null);
    const [files, setFiles] = useState<IDriveFile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState<IUser | null>(null);
    //Additional features: sort, search, pagination
    const [sortBy, setSortBy] = useState<string>("name");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;
    //clone
    const [cloningId, setCloningId] = useState<string | null>(null);
    //profile+ image document upload
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);
    const navigate = useNavigate();
    //Updated state control to set jtw token once and fetch everything else when jwt is set or refreshed
    const imageUploadInputId: string = "drive-image-upload";
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
            const normalizedUser: IUser = {
                ...user,
                imageUrl: user.imageId
                    ? `http://localhost:1234/uploads/${user.imageId}`
                    : undefined
            };

            setUser(normalizedUser);
        } catch (err) {
            console.log(err);
            alert("Access token expired! Logging out...")
            navigate("login")
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

    //Active =>Sort first => then search => then paginate (actually pretty simple)
    const activeFiles: IDriveFile[] = files.filter(
        (file: IDriveFile) => !file.isSoftDeleted
    );

    const sortedFiles: IDriveFile[] = [...activeFiles].sort((a: IDriveFile, b: IDriveFile): number => {
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
    //Filter the sortedFile => start with certain character 
    //Dev notes: Reference to the searchbar feature: https://stackoverflow.com/questions/79003763/i-have-tried-to-implement-search-functionality-in-react-when-i-clear-the-input
    //Though in that example they use a separate component => but filter is good way to render search result live
    //For starting on pagination https://stackoverflow.com/questions/40232847/how-to-implement-pagination-in-react Piotr Berebecki
    //Then I figured that it did not implmenent different page render => https://stackoverflow.com/questions/76511587/how-to-do-pagination-like-google-docs-using-react Ali Safari
    //Then this solution Ali Safari gave use react-pagination lib which is not compatible with my stack (or that was what I though)
    //=>
    const visibleFiles: IDriveFile[] = sortedFiles.filter(
        (file: IDriveFile): boolean =>
            file.filename.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    
    //Front-end pagination to match search and sort also front-end
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedFiles = visibleFiles.slice(
        startIndex,
        startIndex + itemsPerPage
    );
    //upload images
        //upload profile-image
    const uploadProfileImage = async (file: File) => {
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            setUploadingImage(true);

            const res = await fetch("/api/user/profile-image", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwt}`
                },
                body: formData
            });

            if (!res.ok) {
                throw new Error("Failed to upload profile image");
            }

            const data = await res.json();

            // EDITED: update user immediately after upload
            setUser((prev) =>
                prev
                    ? {
                        ...prev,
                        imageId: data.filename,
                        imageUrl: `http://localhost:1234/uploads/${data.filename}`
                    }
                    : prev
            );
            await fetchMe();
        } catch (err) {
            console.log(err);
            alert("Image upload failed");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file: File | undefined= e.target.files?.[0];
        if (!file){
            alert("No file selected");
            return;
        }
        await uploadProfileImage(file);
    };
    const handleDriveImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file: File | undefined = e.target.files?.[0];

        if (!file) {
            alert("No file selected");
            return;
        }

        await uploadDriveImage(file);
    };
    //EDITED: upload Drive image file
    const uploadDriveImage = async (file: File) => {
        const formData: FormData = new FormData();
        formData.append("image", file);
        try {
            setUploadingImage(true);

            const res = await fetch("/api/files/upload-image", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwt}`
                },
                body: formData
            });

            if (!res.ok) {
                throw new Error("Failed to upload image");
            }
            await fetchFiles();
            alert("Image uploaded successfully");
        } catch (err) {
            console.log(err);
            alert("Image upload failed");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleClone = async (fileId: string) => {
        try {
            setCloningId(fileId);

            const res = await fetch(`/api/files/${fileId}/clone`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${jwt}`
                }
            });

            if (!res.ok){
                throw new Error("Cloning  failed");
            }
            const newFile: IDriveFile = await res.json();
            setFiles((prev) => [newFile, ...prev]);//update UI
        } catch (err) {
            console.log("Clone error:", err);
            alert("Failed to clone file");
        } finally {
            setCloningId(null);
        }
    };


    //basic UI (see previous git commit) is done by me
    //I used chatGPT to refine UI
    return (
        <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
            <h2>My Drive</h2>
                {user && (
                    <div
                        style={{
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        padding: "15px",
                        border: "1px solid #ccc",
                        borderRadius: "8px"
                    }}
                    >
                    {user.imageUrl ? (
                        <img
                            src={user.imageUrl}
                            alt="profile"
                            style={{
                                width: "100px",
                                height: "100px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid #ccc"
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "100px",
                                height: "100px",
                                borderRadius: "50%",
                                background: "#ccc"
                            }}
                        />
                    )}

            <div>
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                    {user.username}
                </div>
                <div style={{ marginBottom: "10px" }}>{user.email}</div>

                {/* EDITED: Upload input */}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                />

                {/* EDITED: Loading state */}
                {uploadingImage && <div>Uploading...</div>}
            </div>
            </div>
            )}
            {!jwt ? (
                <p>Please login to fetch the files.</p>
            ) : (
                <>
                    {/* Top buttons */}
                    <div style={{ marginBottom: "20px" }}>
                        <button onClick={createFile} style={{ marginRight: "10px" }}>New File</button>
                        <input id={imageUploadInputId} type="file" accept="image/*" style={{ display: "none" }} onChange={handleDriveImageSelect}/>
                        <button onClick={() => {const imageInput: HTMLElement | null = document.getElementById(imageUploadInputId); imageInput?.click();}}>Upload Image</button>
                        <button onClick={fetchFiles}>Refresh</button>
                        <SearchSortTool searchTerm={searchTerm} setSearchTerm={setSearchTerm} sortBy={sortBy}setSortBy={setSortBy}/>
                    </div>
                    {loading && <p>Loading...</p>}
                    {paginatedFiles.map((file) => {
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
                                    {file.type !== "image" && (<button onClick={() => navigate(`/document/edit/${file._id}`)}>Edit</button>)}
                                    <button onClick={() => navigate(`/document/view/${file._id}`)}>View</button>
                                    <button onClick={() => handleClone(file._id)} disabled={cloningId === file._id}>{cloningId === file._id ? "Cloning..." : "Duplicate"}</button>
                                    <button onClick={() => handleRename(file._id)}>Rename</button>
                                    {isOwner && (
                                        <>{/*NOTE: image files cannot be shared as editors */}
                                        {file.type !== "image" && (<button onClick={() => handleShare(file._id, "edit")}>Share Edit</button>)}
                                            <button onClick={() => handleShare(file._id, "view")}>Share View</button>
                                            <button onClick={() =>togglePublic(file._id, file.isPublic)}>{file.isPublic? "Make Private": "Make Public"}</button>
                                            <button data-testid="cypress-soft-delete-btn" onClick={() => softDelete(file._id)}>Move to Trash</button>
                                            {file.isPublic && (<button onClick={() => copyLink(file)}>Copy Public Link</button>)}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <PaginationTool currentPage={currentPage} totalPages={Math.ceil(visibleFiles.length / itemsPerPage)} setCurrentPage={setCurrentPage}/>
                    {files.length === 0 && !loading && (
                        <p>No files found</p>
                    )}
                </>
            )}
        </div>
    );
};

export default Home;