import { React } from "react";
import "./Table.css";

const Table = ({ records }) => {
  console.log("table records:", records)
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Body</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record, id) => (
          <tr key={id}>
            <td>{id + 1}</td>
            <td>{record.title}</td>
            <td>{record.body}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;