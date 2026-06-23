// components/SearchSortTool.tsx

interface Props {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    sortBy: string;
    setSortBy: (value: string) => void;
}

const SearchSortTool = ({
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy
}: Props) => {
    return (
        <>
            <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <label>Sort By: </label>

            <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
            >
                <option value="name">Name</option>
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Last Updated</option>
            </select>
        </>
    );
};

export default SearchSortTool;