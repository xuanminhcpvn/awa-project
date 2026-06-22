import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";

interface IDriveFile {
    _id: string;
    filename: string;
    contents: string;
}

const DocumentPublic = () => {
    const { driveFileId } = useParams<{ driveFileId: string }>();

    const [document, setDocument] = useState<IDriveFile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const response = await fetch(`/api/document/public/${driveFileId}`);
                const data = await response.json();

                setDocument(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (driveFileId) {
            fetchDocument();
        }
    }, [driveFileId]);

    const modules = {
        toolbar: false,
    };

    if (loading) {
        return <div style={{ padding: "20px" }}>Loading...</div>;
    }

    if (!document) {
        return <div style={{ padding: "20px" }}>Document not found</div>;
    }

    return (
        <div style={{ padding: "20px" }}>
            <h2>{document.filename}</h2>
            <ReactQuill value={document.contents} readOnly={true} theme="snow" modules={modules}/>
        </div>
    );
};

export default DocumentPublic;