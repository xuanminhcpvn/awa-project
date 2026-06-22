import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill/dist/quill.snow.css";
//import "react-quill/dist/quill.bubble.css";//or bubble whatever

interface IDriveFile {
    _id: string;
    filename: string;
    contents: string;
    canEdit: boolean;
}

//Dev note
//Just very simple locking mechanism (doesn't need to care about deadlock since do not need to care aboutconcurrent access) but can cause self-lock and stale lock. Idea:
//Lock document
//User edits
//Save
//Unlock document A when moving out from page 
//backend lock timeout in case lock not terminated somehow preventing stale and self-lock
//Renew lockedAt time every 5 min to prevent timeout from unlocking at wrong timing
//Not sure if I miss any issue in my implemenation since I do not have much time to test on this 

//For data recovery and persistency = we just save current state every 1 minute (or does quill js handle it already)

//I got some help to implement the lock from my friend Oliver Peitsalo
const DocumentEdit = () => {

    const { driveFileId } = useParams<{ driveFileId: string }>();
    const navigate = useNavigate();

    //Document states
    const [filename, setFilename] = useState<string>("");
    const [contents, setContents] = useState<string>("");
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

    //Lock states
    const [isLocked, setIsLocked] = useState<boolean>(false);
    const [currentUserOwnsLock, setCurrentUserOwnsLock] = useState<boolean>(false);
    const [jwt, setJwt] = useState<string | null>(null);
    //Token init once => Separate refresh token function later
    useEffect(() => {
        const token = localStorage.getItem("token");
        setJwt(token);
    }, []);

    useEffect(() => {

        if (!jwt || !driveFileId){
            return;
        }
        const fetchDocument = async (): Promise<void> => {
            try {
                const res = await fetch(`/api/document/${driveFileId}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${jwt}`,
                    },
                });

                if (!res.ok) {
                    throw new Error("Error while fetching file");
                }

                const data: IDriveFile = await res.json();
                if (!data.canEdit) {
                    alert("You do not have permission to edit this document.");
                    navigate("/");
                    return;
                }
                setFilename(data.filename);
                setContents(data.contents);
                await acquireLock();
            } catch (err) {
                console.error("Failed to fetch file:", err);
                navigate("/");
            }
        };
        fetchDocument();
    }, [jwt, driveFileId]);

    //Save button
    const saveDocument = async (): Promise<void> => {
        const token = localStorage.getItem("token");
        await fetch(`/api/document/${driveFileId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                filename: filename,
                contents: contents,
            }),
        });
    };

    const acquireLock = async (): Promise<void> => {

        try {
            const response = await fetch(
                `/api/document/${driveFileId}/lock`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${jwt}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                setIsLocked(true);
                setCurrentUserOwnsLock(false);
                navigate("/");
                return;
            }

            setIsLocked(false);
            setCurrentUserOwnsLock(true);

        } catch (error) {
            console.error("Lock failed:", error);
            setIsLocked(true);
        }
    };

    useEffect(() => {
        if (!jwt || !driveFileId) {
            return;
        }
        const releaseLock = async (): Promise<void> => {
            try {
                await fetch(`/api/document/${driveFileId}/unlock`,{
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${jwt}`
                    }
                }
            );
            } catch (err) {
                console.error("Unlock failed:", err);
                navigate("/");
            }
        };

        return () => {
            if (currentUserOwnsLock) {
                releaseLock();
            }
        };

    }, [currentUserOwnsLock, jwt, driveFileId]);

    //autosave using timeout. Very good implementation idea from Oliver Peitsalo
    useEffect(() => {
        if (!currentUserOwnsLock || !jwt || !driveFileId) return;
        const timeout = setTimeout(async () => {
            try {
                await fetch(`/api/document/${driveFileId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${jwt}`
                        },
                        body: JSON.stringify({
                            filename: filename,
                            contents: contents
                        })
                    }
                );
                setHasUnsavedChanges(false);
            } catch (error) {
                console.error("Autosave failed:", error);
            }
        }, 1200);
        return () => clearTimeout(timeout);
    }, [filename, contents, jwt, driveFileId, currentUserOwnsLock]);

    return (
        <div>
            <input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="Document title" disabled={!currentUserOwnsLock}/>
            <ReactQuill theme="snow" /*or theme=bubble*/ value={contents} onChange={setContents} readOnly={!currentUserOwnsLock}/>
            {isLocked && !currentUserOwnsLock && (
                <p>This document is locked by another user.</p>
            )}
            <button onClick={saveDocument}>Save</button>
        </div>
        
    );
};

export default DocumentEdit;