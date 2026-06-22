import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface IDocument {
    _id: string;
    filename: string;
    contents: string;
}

const DocumentEdit = () => {
    const { fileId } = useParams<{ fileId: string }>();

    const [document, setDocument] = useState<IDocument | null>(null);

    useEffect(() => {
        const fetchDocument = async () => {
            const token = localStorage.getItem("token");

            const response = await fetch(`/api/document/${fileId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            setDocument(data.file);
        };

        if (fileId) {
            fetchDocument();
        }
    }, [fileId]);

    const saveDocument = async () => {
        const token = localStorage.getItem("token");

        await fetch(`/api/document/${fileId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                contents: document?.contents,
            }),
        });
    };

    return (
        <div>
            <h2>{document?.filename}</h2>

            <textarea
                value={document?.contents || ""}
                onChange={(e) =>
                    setDocument(prev =>
                        prev ? { ...prev, contents: e.target.value } : prev
                    )
                }
            />

            <button onClick={saveDocument}>
                Save
            </button>
        </div>
    );
};

export default DocumentEdit;