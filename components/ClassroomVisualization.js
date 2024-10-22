"use client";
import React, { useState, useEffect } from "react";
import NormalSeat from "./NormalSeat";

const ClassroomVisualization = () => {
  const [allocations, setAllocations] = useState([]);
  const [classrooms, setClassrooms] = useState({});
  const [collegeColors, setCollegeColors] = useState({});

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/allocations/");
      const data = await response.json();
      setAllocations(data);

      // Group allocations by classroom
      const groupedClassrooms = data.reduce((acc, allocation) => {
        const { classroom, row, column, sub_column } = allocation;
        if (!acc[classroom.id]) {
          acc[classroom.id] = {
            ...classroom,
            seats: Array(classroom.rows)
              .fill()
              .map(() =>
                Array(classroom.columns)
                  .fill()
                  .map(() => [null, null])
              ),
          };
        }
        acc[classroom.id].seats[row][column][sub_column] = allocation;
        return acc;
      }, {});

      setClassrooms(groupedClassrooms);

      // Generate colors for each college
      const colors = generateCollegeColors(data);
      setCollegeColors(colors);
    } catch (error) {
      console.error("Error fetching allocations:", error);
    }
  };

  const generateCollegeColors = (data) => {
    const colleges = [
      ...new Set(
        data
          .map((allocation) => allocation.student?.college?.id)
          .filter(Boolean)
      ),
    ];
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F06292",
      "#AED581",
      "#7986CB",
      "#4DB6AC",
      "#DCE775",
    ];
    return colleges.reduce((acc, collegeId, index) => {
      acc[collegeId] = colors[index % colors.length];
      return acc;
    }, {});
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Seat Planning Layout</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .classroom { margin-bottom: 40px; }
            .room-name { font-size: 24px; margin-bottom: 10px; }
            .grid { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 10px; 
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
            }
            .bench { 
              border: 1px solid #ccc; 
              padding: 5px; 
              display: flex; 
              justify-content: space-between;
              align-items: center;
              height: 40px;
              margin-bottom: 5px;
            }
            .seat { 
              width: 45%; 
              height: 30px; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              border: 1px solid #999;
              background-color: #f0f0f0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <h1>Seat Planning Layout</h1>
          ${Object.values(classrooms)
            .map(
              (classroom) => `
            <div class="classroom">
              <div class="room-name">${classroom.name}</div>
              <div class="grid">
                ${Array.from(
                  { length: classroom.columns },
                  (_, colIndex) => `
                  <div class="column">
                    ${Array.from({ length: classroom.rows }, (_, rowIndex) => {
                      const leftSeat = classroom.seats[rowIndex][colIndex][0];
                      const rightSeat = classroom.seats[rowIndex][colIndex][1];
                      return `
                        <div class="bench">
                          <div class="seat">${
                            leftSeat?.student?.roll_number || ""
                          }</div>
                          <div class="seat">${
                            rightSeat?.student?.roll_number || ""
                          }</div>
                        </div>
                      `;
                    }).join("")}
                  </div>
                `
                ).join("")}
              </div>
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const renderSeat = (allocation, row, column, subColumn) => {
    const isAllocated = allocation != null;
    const collegeId = allocation?.student?.college?.id;
    const studentRoll = allocation?.student?.roll_number;
    const seatColor = isAllocated ? collegeColors[collegeId] || "gray" : "gray";

    const getTooltipContent = () => {
      if (!isAllocated) return "Unallocated seat";
      return `Name: ${allocation.student?.name || "N/A"}
College: ${allocation.student?.college?.name || "N/A"}
Roll Number: ${studentRoll || "N/A"}
Row: ${row}, Column: ${column}, Sub Column: ${subColumn}`;
    };

    return (
      <div
        key={`seat-${row}-${column}-${subColumn}`}
        style={{
          display: "inline-block",
          margin: "0 10px",
          cursor: "pointer",
        }}
        title={getTooltipContent()}
      >
        <NormalSeat width={40} height={40} color={seatColor} />
      </div>
    );
  };

  const renderClassroom = (classroom) => {
    return (
      <div
        key={classroom.id}
        className="classroom"
        style={{ margin: "10px", width: "calc(30% - 20px)", minWidth: "400px" }}
      >
        <h3 style={{ fontSize: "18px", marginBottom: "10px", color: "black" }}>
          {classroom.name}
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "2px solid #ccc",
            padding: "5px 2px",
            backgroundColor: "#f9f9f9",
          }}
        >
          {classroom.seats.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "1px 0",
              }}
            >
              {row.map((col, colIndex) => (
                <div
                  key={`bench-${rowIndex}-${colIndex}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    margin: "0 22px", //bench
                    border: "1px solid #ddd",
                    padding: "1px",

                    backgroundColor: "white",
                  }}
                >
                  {renderSeat(col[0], rowIndex, colIndex, 0)}
                  {renderSeat(col[1], rowIndex, colIndex, 1)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLegend = () => {
    return (
      <div
        className="legend"
        style={{
          marginTop: "20px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <h4
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: "16px",
            margin: "0 0 10px 0",
            color: "black",
          }}
        >
          College Legend:
        </h4>
        {Object.entries(collegeColors).map(([collegeId, color]) => {
          const collegeName = allocations.find(
            (a) => a.student?.college?.id === parseInt(collegeId)
          )?.student?.college?.name;
          return (
            <div
              key={collegeId}
              style={{
                margin: "5px 10px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: color,
                  marginRight: "8px",
                  border: "1px solid #ddd",
                }}
              ></div>
              <span style={{ color: "black", fontSize: "14px" }}>
                {collegeName || `College ${collegeId}`}
              </span>
            </div>
          );
        })}
        <div
          style={{ margin: "5px 10px", display: "flex", alignItems: "center" }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: "brown",
              marginRight: "8px",
              border: "1px solid #ddd",
            }}
          ></div>
          <span style={{ color: "black", fontSize: "14px" }}>
            Unallocated Seat
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="classroom-visualization" style={{ padding: "0 10px" }}>
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontSize: "24px",
          color: "black",
        }}
      >
        Classroom Allocations
      </h2>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={handlePrint}
          style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
        >
          Print Seat Layout
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0",
        }}
      >
        {Object.values(classrooms).map(renderClassroom)}
      </div>
      {renderLegend()}
    </div>
  );
};

export default ClassroomVisualization;
