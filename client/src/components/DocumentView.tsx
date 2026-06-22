import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface IDocument {
    _id: string;
    filename: string;
    contents: string;
}

const DocumentView = () => {
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

    return (
        <div>
            <h2>{document?.filename}</h2>
            <p>{document?.contents}</p>
        </div>
    );
};

export default DocumentView;