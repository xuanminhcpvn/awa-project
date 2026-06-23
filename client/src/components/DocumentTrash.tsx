import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface IDriveFile {
    _id: string;
    ownerId: string;
    filename: string;
    type: "text" | "spreadsheet" | "slide" | "image";
    createdAt: string;
    updatedAt: string;
    isPublic: boolean;
    isSoftDeleted: boolean;
    softDeletedAt: string;
    shareLink: string;
}

interface IUser {
    _id: string;
    username: string;
    email: string;
}

const Trash = () => {
    const [jwt, setJwt] = useState<string | null>(null);
    const [files, setFiles] = useState<IDriveFile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState<IUser | null>(null);

    const [sortBy, setSortBy] = useState<string>("updatedAt");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) setJwt(token);
    }, []);

    useEffect(() => {
        if (!jwt) return;
        fetchFiles();
        fetchMe();
    }, [jwt]);

    // GET files
    const fetchFiles = async () => {
        setLoading(true);

        try {
            const res = await fetch("/api/files/trash", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`,
                },
            });

            if (!res.ok) throw new Error("Fetch failed");

            const data: IDriveFile[] = await res.json();
            setFiles(data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMe = async () => {
        try {
            const res = await fetch("/api/user/me", {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            if (!res.ok) throw new Error("User fetch failed");

            setUser(await res.json());
        } catch (err) {
            console.log(err);
        }
    };


    //TRASH-only action (for refactoring later)
    //Restore files
    const restoreFile = async (id: string) => {
        try {
            const res = await fetch(`/api/files/${id}/restore`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
            });

            if (!res.ok) throw new Error("Restore failed");

            fetchFiles();
        } catch (err) {
            console.log(err);
        }
    };
    //permanent
    const permanentDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/files/${id}/permanent-delete`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            });

            if (!res.ok) throw new Error("Delete failed");

            fetchFiles();
        } catch (err) {
            console.log(err);
        }
    };
    //similar like in home but Trash => sort => search => paginate
    const trashedFiles = files.filter((file) => file.isSoftDeleted);

    const sortedFiles = [...trashedFiles].sort((a, b) => {
        if (sortBy === "filename") {
            return a.filename.localeCompare(b.filename);
        }

        if (sortBy === "createdAt") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const searchedFiles = sortedFiles.filter((f) =>
        f.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;

    const paginatedFiles = searchedFiles.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    const totalPages = Math.ceil(searchedFiles.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy]);

    return (
        <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
            <h2>Own Trash Bin</h2>

            <button onClick={() => navigate("/")}>Back to Home</button>

            {!jwt ? (
                <p>Please login</p>
            ) : (
                <>
                    {/* Controls */}
                    <div style={{ marginBottom: "20px" }}>
                        <input
                            placeholder="Search trash..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="filename">Name</option>
                            <option value="createdAt">Created</option>
                            <option value="updatedAt">Updated</option>
                        </select>
                    </div>

                    {loading && <p>Loading...</p>}

                    {/* FILE LIST */}
                    {paginatedFiles.map((file) => {
                        const isOwner = user?._id === file.ownerId;

                        return (
                            <div
                                key={file._id}
                                style={{
                                    border: "1px solid #ccc",
                                    padding: "15px",
                                    marginBottom: "10px",
                                    borderRadius: "8px",
                                }}
                            >
                                <strong>{file.filename}</strong>
                                <div>Deleted at: {file.softDeletedAt}</div>

                                <div style={{ marginTop: "10px" }}>
                                    {/* ONLY ALLOWED ACTIONS */}

                                    {isOwner && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    restoreFile(file._id)
                                                }
                                            >
                                                Restore
                                            </button>

                                            <button
                                                onClick={() =>
                                                    permanentDelete(file._id)
                                                }
                                                style={{ color: "red" }}
                                            >
                                                Delete Forever
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Pagination */}
                    <div style={{ marginTop: "20px" }}>
                        <button
                            onClick={() =>
                                setCurrentPage((p) => Math.max(p - 1, 1))
                            }
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>

                        <span style={{ margin: "0 10px" }}>
                            Page {currentPage} / {totalPages || 1}
                        </span>

                        <button
                            onClick={() =>
                                setCurrentPage((p) =>
                                    p < totalPages ? p + 1 : p
                                )
                            }
                            disabled={currentPage >= totalPages}
                        >
                            Next
                        </button>
                    </div>

                    {files.length === 0 && !loading && <p>No trash items</p>}
                </>
            )}
        </div>
    );
};

export default Trash;