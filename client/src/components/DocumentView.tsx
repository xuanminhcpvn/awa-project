import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";

interface IDocument {
    _id: string;
    filename: string;
    contents: string;
}

const DocumentPublic = () => {
    const { driveFileId } = useParams<{ driveFileId: string }>();
     const [jwt, setJwt] = useState<string | null>(null);
    const [document, setDocument] = useState<IDocument | null>(null);
    //Token init once => Separate refresh token function later
    useEffect(() => {
        const token = localStorage.getItem("token");
        setJwt(token);
    }, []);

    useEffect(() => {
        if (!driveFileId || !jwt) return;

        const fetchDocument = async () => {
            try {
                const response = await fetch(`/api/document/${driveFileId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${jwt}`
                    }
                });

                const data = await response.json();
                setDocument(data);
            } catch (err) {
                console.error(err);
            }
            };

            fetchDocument();
    }, [driveFileId, jwt]);

    const modules = {
        toolbar: false, 
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>{document?.filename}</h2>
            {document ? (
                <ReactQuill value={document.contents} readOnly={true} modules={modules} theme="snow"/>
                ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default DocumentPublic;