"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "./mystudents.module.css";
import Image from "next/image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function MyStudents({token}) {
  const [students, setStudents] = useState([]);
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {
      async function getData() {
        const students_data = await fetch(`${backend_url}/getTStudents`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        });
        const data = await students_data.json();
        setStudents(data.students || []);
      }
      if (token) {
        getData();
      }
    }, [token]);

    const sortStudents = (key, order = "asc") => {
      let sortStudents =  [...students].sort((a, b) => {
        if (!a[key] || !b[key]) return 0;

        const valueA = a[key].toString().toLowerCase();
        const valueB = b[key].toString().toLowerCase();

        if (order === "asc") {
          return valueA.localeCompare(valueB, undefined, { numeric: true });
        } else {
          return valueB.localeCompare(valueA, undefined, { numeric: true });
        }
      });
      setStudents(sortStudents)
    };

      const tableRef = useRef(null);

      const downloadPDF = async () => {
        if (!tableRef.current) {
          alert("No table found!");
          return;
        }

        const input = tableRef.current;

        // Clone the table deeply to ensure all elements are included
        const clonedTable = input.cloneNode(true);

        // Give the cloned table a temporary wrapper for easier manipulation
        const tempDiv = document.createElement("div");
        tempDiv.appendChild(clonedTable);
        document.body.appendChild(tempDiv); // Temporarily add it to the DOM

        // Ensure table structure exists before processing
        const headerCells = tempDiv.querySelectorAll("thead tr th");
        const bodyRows = tempDiv.querySelectorAll("tbody tr");

        if (!headerCells.length || !bodyRows.length) {
          alert("Error: Unable to find table elements.");
          tempDiv.remove(); // Clean up
          return;
        }

        // Identify indexes of columns to remove
        const removeIndexes = [];
        headerCells.forEach((th, index) => {
          const text = th.textContent.trim().toLowerCase();
          if (text === "action" || text === "link of portfolio") {
            removeIndexes.push(index);
          }
        });

        // Remove headers
        removeIndexes.reverse().forEach((index) => {
          if (headerCells[index]) headerCells[index].remove();
        });

        // Remove corresponding columns from each row
        bodyRows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          removeIndexes.forEach((index) => {
            if (cells[index]) cells[index].remove();
          });
        });

        try {
          // Fetch logo image
          const response = await fetch("/logo2.png");
          const blob = await response.blob();
          const reader = new FileReader();

          reader.onloadend = () => {
            const logoDataURL = reader.result;
            generatePDF(tempDiv, logoDataURL);
            tempDiv.remove(); // Clean up cloned table
          };

          reader.readAsDataURL(blob);
        } catch (error) {
          console.error("Failed to load logo:", error);
          generatePDF(tempDiv, null);
          tempDiv.remove(); // Clean up cloned table
        }
      };

      const generatePDF = (tableContainer, logoDataURL) => {
        html2canvas(tableContainer, { scale: 2 }).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");

          const pageWidth = pdf.internal.pageSize.getWidth();
          const logoWidth = 100; // Adjust logo width
          const logoHeight = 22; // Adjust logo height
          const logoX = (pageWidth - logoWidth) / 2; // Auto-center horizontally
          const logoY = 5; // Position from top
          // Add logo if available
          if (logoDataURL) {
            pdf.addImage(
              logoDataURL,
              "PNG",
              logoX,
              logoY,
              logoWidth,
              logoHeight
            );
          }

          // Add heading
          pdf.setFontSize(18);
          pdf.text("My Students", 105, 40, { align: "center" });

          // Add table image
          const imgWidth = 190;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          pdf.addImage(imgData, "PNG", 10, 50, imgWidth, imgHeight);

          pdf.save("logs.pdf");
        });
      };

  return (
    <div className={styles.mainBox}>
      <div className={styles.header}>
        <label>
          Sort By :{" "}
          <select
            onChange={(e) => {
              sortStudents(e.target.value);
            }}
            defaultValue={""}
          >
            <option value="" disabled>
              Select
            </option>
            <option value="enroll">Enroll</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
        </label>
        <button onClick={downloadPDF}>PDF</button>
      </div>
      <section className={styles.tableSection}>
        <table ref={tableRef} className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              {["Enroll", "Name", "Email", "Mobile"].map((heading) => (
                <th key={heading} className={styles.tableCell}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student, rowIndex) => (
                <tr key={rowIndex}>
                  <td className={styles.tableCell}>{student.enrollNo || "-"}</td>
                  <td className={styles.tableCell}>{student.name || "-"}</td>
                  <td className={styles.tableCell}>{student.email || "-"}</td>
                  <td className={styles.tableCell}>{student.phone || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="12"
                  className={`${styles.tableCell} ${styles.nofound}`}
                >
                  <p>No Students !</p>
                  <Image
                    src={"/gifs/no-found.gif"}
                    width={250}
                    height={250}
                    alt="gif"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
