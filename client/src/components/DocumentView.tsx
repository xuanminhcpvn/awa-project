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

    const [document, setDocument] = useState<IDocument | null>(null);

    useEffect(() => {
        const fetchDocument = async () => {
            const response = await fetch(`/api/document/${driveFileId}`);

            const data = await response.json();
            setDocument(data);
        };

        if (driveFileId) {
            fetchDocument();
        }
    }, [driveFileId]);

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