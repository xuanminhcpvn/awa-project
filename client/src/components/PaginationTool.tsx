interface PaginationProps {
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

const PaginationTool = ({
    currentPage,
    totalPages,
    setCurrentPage,
}: PaginationProps) => {
    return (
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
    );
};

export default PaginationTool;