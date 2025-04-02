import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRecords, setItemsPerPage } from "./store";
import Table from "./components/Table.jsx";
import "./App.css";
import { debounce } from "lodash"; // Import lodash for debouncing

const Lazyloading = () => {
  const dispatch = useDispatch();
  const {
    data,
    loading,
    error,
    itemsPerPage: reduxItemsPerPage,
    totalRecords,
  } = useSelector((state) => state.records);

  const [currentPage, setCurrentPage] = useState(1); // Track the current page
  const currentPageRef = useRef(currentPage); // Ref to keep track of the current page

  useEffect(() => {
    currentPageRef.current = currentPage; // Sync the ref with the state
  }, [currentPage]);

  // Fetch initial data on mount
  useEffect(() => {
    if (!data[1]) {
      dispatch(fetchRecords(1)); // Fetch the first page
    }
  }, [dispatch, data]);

  // Lazy loading on scroll
  useEffect(() => {
    const handleScroll = debounce(() => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // If the user scrolls near the bottom, fetch the next page
      if (scrollTop + windowHeight >= documentHeight - 100 && !loading) {
        const nextPage = currentPageRef.current + 1;
        const totalPages = Math.ceil(totalRecords / reduxItemsPerPage);

        if (nextPage <= totalPages && !data[nextPage]) {
          dispatch(fetchRecords(nextPage)); // Fetch the next page
          setCurrentPage(nextPage); // Update the current page
        }
      }
    }, 200); // Debounce with a delay of 200ms

    window.addEventListener("scroll", handleScroll); // Attach the scroll event listener
    return () => {
      window.removeEventListener("scroll", handleScroll); // Clean up the event listener
      handleScroll.cancel(); // Cancel any pending debounced calls
    };
  }, [data, dispatch, loading, totalRecords, reduxItemsPerPage]);

  // Combine all loaded data into a single array
  const allRecords = Object.values(data).flat();

  return (
    <div className="app">
      <h1>Table with Lazy Loading</h1>
      <p>
        data pages: {Object.keys(data).length}
      </p>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {!loading && allRecords.length === 0 && totalRecords > 0 && (
        <p>No records available</p>
      )}
      {!loading && allRecords.length > 0 && <Table records={allRecords} />}

    </div>
  );
};

export default Lazyloading;