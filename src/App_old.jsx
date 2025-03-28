import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRecords, setItemsPerPage } from "./store";
import Table from "./components/Table.jsx";
import Pagination from "./components/Pagination.jsx";
import "./App.css";

const App = () => {
  const dispatch = useDispatch();
  const { data, loading, error, itemsPerPage, totalRecords } = useSelector(
    (state) => state.records
  );

  const [currentPage, setCurrentpage] = useState(1);
  const [lastZoomLevel, setLastZoomLevel] = useState(
    window.devicePixelRatio || 1
  );

  // const recordsState = useSelector((state)=>state.records, (prev,next)=>{
  //   // Custom equality check to ensure a force re-render when data[currentPage] changes
  //   return prev.data[currentPage] === next.data[currentPage] &&
  //          prev.loading === next.loading &&
  //          prev.error === next.error &&
  //          prev.itemsPerPage === next.itemsPerPage &&
  //          prev.totalRecords === next.totalRecords;
  // })
  // const { data, loading, error, itemsPerPage, totalRecords } = recordsState;

  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const ZOOM_LEVELS = [
    0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5,
    3.0, 4.0,
  ];
  const BASE_ITEMS_PER_PAGE = 10; // base number of items per page at 100% zoom

  // update itemsPerPage based on Zoom level
  const updateItemsPerPage = () => {
    const currentZoom = window.devicePixelRatio || 1;
    const closestZoom = ZOOM_LEVELS.reduce((prev, curr) => {
      return Math.abs(curr - currentZoom) < Math.abs(prev - currentZoom)
        ? curr
        : prev;
    }); // find the closest predefined zoom level

    // only update if zoom level changes significantly - avoid unnessary updates
    if (Math.abs(closestZoom - lastZoomLevel) > 0.01) {
      let newItemsPerPage;
      if (closestZoom === 1.0) {
        newItemsPerPage = BASE_ITEMS_PER_PAGE;
      } else if (closestZoom < 1.0) {
        newItemsPerPage = Math.round(BASE_ITEMS_PER_PAGE * (1 / closestZoom));
      } else {
        newItemsPerPage = Math.round(BASE_ITEMS_PER_PAGE / closestZoom);
      }
      // const newItemsPerPage = Math.round(BASE_ITEMS_PER_PAGE / closestZoom); //adjusts items per page inverselywith zoom
      const firstRecordIndex = (currentPage - 1) * itemsPerPage; //index of first record on current page
      console.log("zoom debug:", {currentZoom, closestZoom, newItemsPerPage, firstRecordIndex})
      dispatch(setItemsPerPage(Math.max(1, newItemsPerPage))); //set new itsms per page , min 1
      const newPage = Math.floor(firstRecordIndex / newItemsPerPage) + 1; //recalculating page to preserve record range
      setCurrentpage(newPage);
      setLastZoomLevel(closestZoom);
    }
  };

  // fetch initial pages (1 and 2) on mount
  useEffect(() => {
    dispatch(fetchRecords(1));
    dispatch(fetchRecords(2));
    if(window.devicePixelRatio === 1.0){
      dispatch(setItemsPerPage(BASE_ITEMS_PER_PAGE));
    }
    // console.log(
    //   " data, loading, error, itemsPerPage, totalRecords ",
    //   data,
    //   loading,
    //   error,
    //   itemsPerPage,
    //   totalRecords
    // );
  }, [dispatch]);

  useEffect(() => {
    // fetch data for current page if not in state
    if (!data[currentPage]) {
      dispatch(fetchRecords(currentPage));
    }
    // prefetch next page
    const nextPage = currentPage + 1;
    if (nextPage <= totalPages && !data[currentPage]) {
      dispatch(fetchRecords(nextPage));
    }
  }, [currentPage, data, dispatch]);

  // Detect zoom changes via re-size events and polling
  useEffect(() => {
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage); //listen to rezise - zoom changes
    const zoomCheck = setInterval(updateItemsPerPage, 200); // poll every 500ms for zoom changes
    return () => {
      window.removeEventListener("resize", updateItemsPerPage);
      clearInterval(zoomCheck);
    };
  }, [lastZoomLevel, dispatch, currentPage, itemsPerPage]); // these dependencies ensure re-run on relevant changes

  // useEffect(()=>{
  //   const timer = setTimeout(()=>dispatch(setItemsPerPage(20)),2000);
  //   return ()=>clearTimeout(timer)
  // },[dispatch])

  const handlePageChange = (page) => {
    setCurrentpage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentpage(currentPage - 1);
    }
  };
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentpage(currentPage + 1);
    }
  };

  // const currentRecords = data[currentPage] || [];
  const currentRecords = (()=>{
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
    const records = [];
    for(let i = Math.ceil(startIndex / BASE_ITEMS_PER_PAGE); i <= Math.ceil(endIndex / BASE_ITEMS_PER_PAGE); i++ ){
      if(data[i]){
        records.push(...data[i]);
      }else{
        dispatch(fetchRecords(i))
      }
    }
    const startOffset = startIndex % BASE_ITEMS_PER_PAGE;
    return records.slice(startOffset, startOffset + itemsPerPage);
  })();
  console.log(
    "current page:",
    currentPage,
    "records:",currentRecords,
    "items:",currentRecords.length,
    "zoom:",
    window.devicePixelRatio.toFixed(2)
  );

  // console.log("redux state:", recordsState); // logs fullState

  return (
    <div className="app">
      <h1>Table with pagination</h1>
      {loading && <p>loading...</p>}
      {error && <p>error...</p>}
      {!loading && currentRecords.length === 0 && totalRecords > 0 && (
        <p>No records for this page yet</p>
      )}
      {!loading && currentRecords.length > 0 && (
        <Table records={currentRecords} />
      )}
      {totalRecords > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
      <p>
        items per page : {itemsPerPage} (zoom :{" "}
        {window.devicePixelRatio.toFixed(2)}x)
      </p>
    </div>
  );
};

export default App;
