import  React  from "react";
import "./Pagination.css";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  onPrevious,
  onNext,
}) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination">
      <button
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="nav-button"
      >
        previous
      </button>
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`page-button ${currentPage === number ? "active" : ""}`}
        >
          {number}
        </button>
      ))}
      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="nav-button"
      >
        next
      </button>
    </div>
  );
};

export default Pagination;