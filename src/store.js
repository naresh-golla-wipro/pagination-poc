import { configureStore, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { enableMapSet } from "immer"; // Import the plugin


enableMapSet();

//slice for mapping records
const recordsSlice = createSlice({
  name: "records",
  initialState: {
    data: {}, //store records by page number
    loading: false,
    loadingPages: [], // tracks pages currently being fetched
    error: null,
    itemsPerPage: 10,
    totalRecords: 0,
  },
  reducers: {
    fetchRecordsInitiate(state, action) {
      state.loading = true;
      state.error = null;
    },
    fetchRecordsSuccess(state, action) {
      console.log("fetchRecordsSuccess:state",state,"action:",action)
      const { page, records, total } = action.payload;
      state.data[page] = records
      state.totalRecords = total;
      state.loading = false;
      console.log("state updated after success", state.data)
    },
    fetchRecordsFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    setItemsPerPage(state, action) {
      state.itemsPerPage = action.payload; 
      // state.data = {}; // Reset data when items per page changes
    },
  },
});

// Actions
export const {
  fetchRecordsInitiate,
  fetchRecordsSuccess,
  fetchRecordsFailure,
  setItemsPerPage,
} = recordsSlice.actions;

// Thunk to fetch records
export const fetchRecords = (page) => async (dispatch, getState) => {
  const { records } = getState();
  const { data, itemsPerPage ,loadingPages} = records;

  // If data for this page already exists state or is being fetched, don't fetch again
  if (data[page] || loadingPages.includes(page)) return;

  dispatch(fetchRecordsInitiate(page));
  try {
    const res = await axios.get(
      `https://jsonplaceholder.typicode.com/posts?_pages=${page}&_limit=10`
    );
    const total = parseInt(res.headers["x-total-count"], 10) || 100; // Fetch total records dynamically if available
    // const total = 100; // json placeholder has 100 posts total
    dispatch(fetchRecordsSuccess({ page, records: res.data, total }));
    console.log("fetched data for page ", page, res.data)
  } catch (error) {
    console.error("Error fetching data for page", page, error);
    dispatch(fetchRecordsFailure({ page, error: error.message }));
  }
};

//store
const store = configureStore({
  reducer: {
    records: recordsSlice.reducer, // using generated reducer function 
  }
});

export default store;