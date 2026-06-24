import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
    return (
    <div style={{ justifyContent: "center", marginTop: "20px", display: "flex", flexWrap: "wrap", alignItems: "center",gap: "10px"}}>
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>{t("Prev")}</button>
        <span style={{ margin: "0 10px" }}>{t("Page")} {currentPage} / {totalPages || 1}</span>
        <button onClick={() => setCurrentPage((p) => p < totalPages ? p + 1 : p)} disabled={currentPage >= totalPages}>{t("Next")}</button>
    </div>
    );
};
export default PaginationTool;