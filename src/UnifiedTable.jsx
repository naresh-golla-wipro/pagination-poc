import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRecords, setItemsPerPage } from "./store";
import Table from "./components/Table.jsx";
import Pagination from "./components/Pagination.jsx";
import { debounce } from "lodash";
import "./App.css";

const UnifiedTable = ({ useLazyLoading }) => {
  const dispatch = useDispatch();
  const {
    data,
    loading,
    error,
    itemsPerPage: reduxItemsPerPage, // ectracted from store
    totalRecords,
  } = useSelector((state) => state.records);

  useEffect(() => {
    console.log(
      "state.records",
      data,
      loading,
      error,
      reduxItemsPerPage,
      "totalRecords:",
      totalRecords,
      "data[currentPage]:",
      data[currentPage]
    );
  }, [data, loading, error, reduxItemsPerPage, totalRecords]);

  const [currentPage, setCurrentpage] = useState(1);
  const [lastZoomLevel, setLastZoomLevel] = useState(
    1 / (window.innerWidth / window.screen.width) || 1
  );
  const BASE_ITEMS_PER_PAGE = 10; // Base number of items per page at 100% zoom
  const currentPageRef = useRef(currentPage); // Ref to keep track of the current page

  useEffect(() => {
    if (useLazyLoading) {
      if (!data[1]) dispatch(fetchRecords(1));
    } else {
      console.log("useLazyLoading", useLazyLoading);
      if (!data[1]) dispatch(fetchRecords(1));
      if (!data[2]) dispatch(fetchRecords(2));
    }
  }, [dispatch, data, useLazyLoading]);

  // Fetch data for the current page and prefetch the next page
  useEffect(() => {
    if (!useLazyLoading) {
      if (!data[currentPage]) {
        dispatch(fetchRecords(currentPage));
        console.log("useLazyLoading fetch currentPage page", currentPage);
      }
      const nextPage = currentPage + 1;
      console.log(
        ">>>totalRecords / reduxItemsPerPage:",
        totalRecords / reduxItemsPerPage,
        "nextPage:",
        nextPage
      );
      if (
        nextPage <= Math.ceil(totalRecords / BASE_ITEMS_PER_PAGE) &&
        !data[nextPage]
      ) {
        dispatch(fetchRecords(nextPage));
        console.log("useLazyLoading:fetch next page", nextPage);
      }
    }
  }, [
    currentPage,
    data,
    dispatch,
    totalRecords,
    reduxItemsPerPage,
    useLazyLoading,
  ]);

  // Detect zoom changes via resize events
  const updateItemsPerPage = () => {
    // Dynamically calculate the absolute zoom level
    const absoluteZoom = 1 / (window.innerWidth / window.screen.width);

    // Only update if zoom level changes significantly
    if (Math.abs(absoluteZoom - lastZoomLevel) > 0.01) {
      const newItemsPerPage = Math.max(
        1,
        Math.round(BASE_ITEMS_PER_PAGE / absoluteZoom)
      ); // Dynamically calculate items per page

      // Only dispatch if itemsPerPage has actually changed
      if (newItemsPerPage !== reduxItemsPerPage) {
        dispatch(setItemsPerPage(newItemsPerPage)); // Update items per page in Redux
      }
      // setCurrentpage(newPage); // Update current page
      setLastZoomLevel(absoluteZoom); // Update last zoom level
    }
  };

  useEffect(() => {
    if (!useLazyLoading) {
      updateItemsPerPage();
      window.addEventListener("resize", updateItemsPerPage); // Listen to resize - zoom changes
      // const timer = setTimeout(updateItemsPerPage, 500); // polling 500ms
      return () => {
        window.removeEventListener("resize", updateItemsPerPage);
        // clearTimeout(timer);
      };
    }
  }, [lastZoomLevel, reduxItemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentpage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentpage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < Math.ceil(totalRecords / reduxItemsPerPage)) {
      setCurrentpage(currentPage + 1);
    }
  };

  // Updated currentRecords logic
  const currentRecords = (() => {
    if (useLazyLoading) {
      console.log("data",data)
      return Object.values(data).flat();
    } else {
      const startIndex = (currentPage - 1) * reduxItemsPerPage;
      // const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
      const endIndex = startIndex + reduxItemsPerPage;
      const records = [];
      //add records from currentPage
      if (data[currentPage]) {
        records.push(...data[currentPage]);
      }

      //add records from nextPage if records are less than itemsPerPage
      const nextPage = currentPage + 1;
      if (data[nextPage] && records.length < reduxItemsPerPage) {
        const extraRecords = data[nextPage].slice(
          0,
          reduxItemsPerPage - records.length
        );
        records.push(...extraRecords);
      }
      console.log(
        ">reduxItemsPerPage:",
        reduxItemsPerPage,
        "records:",
        records
      );
      return records.slice(0, reduxItemsPerPage);
    }
  })();


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

        console.log("Next Page:", nextPage, "Total Pages:", totalPages);

        if (nextPage <= totalPages && !data[nextPage]) {
          dispatch(fetchRecords(nextPage)); // Fetch the next page
          setCurrentpage(nextPage); // Update the current page
          currentPageRef.current = nextPage; // Update the ref
        }
      }
    }, 200); // Debounce with a delay of 200ms

    window.addEventListener("scroll", handleScroll); // Attach the scroll event listener
    return () => {
      window.removeEventListener("scroll", handleScroll); // Clean up the event listener
      handleScroll.cancel(); // Cancel any pending debounced calls
    };
  }, [data, dispatch, loading, totalRecords, reduxItemsPerPage]);

  return (
    <div className="app">
      <h1>Table </h1>
      {useLazyLoading && <p>data pages: {Object.keys(data).length}</p>}
      {loading && <p>Loading...</p>}
      {error && <p>Error...{error}</p>}
      {!loading && currentRecords.length === 0 && totalRecords > 0 && (
        <p>No records for this page yet</p>
      )}
      {!loading && currentRecords.length > 0 && (
        <Table records={currentRecords} />
      )}
      {!useLazyLoading && totalRecords > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRecords / BASE_ITEMS_PER_PAGE)}
          onPageChange={handlePageChange}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
      {!useLazyLoading && (
        <p>
          Items per page: {reduxItemsPerPage} (Zoom:{" "}
          {1 / (window.innerWidth / window.screen.width)})
        </p>
      )}
    </div>
  );
};

export default UnifiedTable;
