import React, { useState, useEffect, use } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRecords, setItemsPerPage } from "./store";
import Table from "./components/Table.jsx";
import Pagination from "./components/Pagination.jsx";
import "./App.css";

const App = () => {
  const dispatch = useDispatch();
  const {
    data,
    loading,
    error,
    itemsPerPage: reduxItemsPerPage, // ectracted from store
    totalRecords,
    loadingPages,
  } = useSelector((state) => state.records);

    useEffect(()=>{
  console.log("state.records",data, loading, error, reduxItemsPerPage, "totalRecords:",totalRecords, loadingPages , "data[currentPage]:",data[currentPage])
    },[data, loading, error, reduxItemsPerPage, totalRecords, loadingPages ])
  const [currentPage, setCurrentpage] = useState(1);

  const [lastZoomLevel, setLastZoomLevel] = useState(
    1 / (window.innerWidth / window.screen.width) || 1
  );
  
  const BASE_ITEMS_PER_PAGE = 10; // Base number of items per page at 100% zoom

  useEffect(()=>{
    document.body.style.zoom = "1";
    document.documentElement.style.zoom = "1";
  },[])
  useEffect(() => {
    if (!data[1]) dispatch(fetchRecords(1));
    if (!data[2]) dispatch(fetchRecords(2));
  }, [dispatch, data]);

  // Fetch data for the current page and prefetch the next page
  useEffect(() => {
    if (
      !data[currentPage]
    ) {
      dispatch(fetchRecords(currentPage));
      console.log("fetch currentPage page", currentPage)
    }
    const nextPage = currentPage + 1;
    console.log(">>>totalRecords / reduxItemsPerPage:",totalRecords / reduxItemsPerPage,"nextPage:",nextPage);
    if (
      nextPage <= Math.ceil(totalRecords / BASE_ITEMS_PER_PAGE) && 
      !data[nextPage]
    ) {
      dispatch(fetchRecords(nextPage));
      console.log("fetch next page", nextPage)
    }
  }, [
    currentPage,
    data,
    dispatch,
    totalRecords,
    reduxItemsPerPage
  ]);

  // Detect zoom changes via resize events
  useEffect(() => {
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage); // Listen to resize - zoom changes
    // const timer = setTimeout(updateItemsPerPage, 500); // polling 500ms
    return () => {
      window.removeEventListener("resize", updateItemsPerPage);
      // clearTimeout(timer);
    };
  }, [lastZoomLevel, reduxItemsPerPage]);

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

  const currentRecords = (() => {
    const startIndex = (currentPage - 1) * reduxItemsPerPage;
    // const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
    const endIndex = startIndex + reduxItemsPerPage;
    const records = [];
    //add records from currentPage
    if (data[currentPage]) {
      records.push(...data[currentPage]);
    }
    console.log("<reduxItemsPerPage:",reduxItemsPerPage,"records:",records, "records.length",records.length)

    //add records from nextPage if records are less than itemsPerPage
    const nextPage = currentPage + 1;
    if (data[nextPage] && records.length < reduxItemsPerPage) {
      const extraRecords = data[nextPage].slice(
        0,
        reduxItemsPerPage - records.length
      );
      records.push(...extraRecords);
    }
    console.log(">reduxItemsPerPage:",reduxItemsPerPage,"records:",records)
    // const startOffset = startIndex % BASE_ITEMS_PER_PAGE;
    // return records.slice(startOffset, startOffset + itemsPerPage);
    return records.slice(0,reduxItemsPerPage);
  })();

  return (
    <div className="app">
      <h1>Table with Pagination</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error...</p>}
      {!loading && currentRecords.length === 0 && totalRecords > 0 && (
        <p>No records for this page yet</p>
      )}
      {!loading && currentRecords.length > 0 && (
        <Table records={currentRecords} />
      )}
      {totalRecords > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRecords / BASE_ITEMS_PER_PAGE)}
          onPageChange={handlePageChange}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
      <p>
        Items per page: {reduxItemsPerPage} (Zoom:{" "}
        {1 / (window.innerWidth / window.screen.width)})
      </p>
    </div>
  );
};

export default App;
