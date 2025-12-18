"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import styles from "./Summary.module.css";
import Image from "next/image";
import Navbar from "@/components/navbar/page";
import { useRouter, useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Loading from "@/components/Loading/page";
import autoTable from "jspdf-autotable";

function DashboardContent() {
  const [student, setStudent] = useState([]);
  const [token, setToken] = useState("");
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;
  const handleStudentData = (studentData) => {
    setStudent(studentData);
    setToken(studentData.token);
  };

  const [summary, setSummary] = useState([]);
  const searchParams = useSearchParams();
  const course_id = parseInt(searchParams.get("ci"));
  const subject_id = parseInt(searchParams.get("si"));
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);


    useEffect(() => {
        async function getData() {
          const general_data = await fetch(`${backend_url}/getGeneral`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await general_data.json();
          setCourses(data.courses || []);
          setSubjects(data.subjects || []);
        }
        if (token) {
          getData();
        }
      }, [student]);

  useEffect(() => {
    async function getData() {
      const general_data = await fetch(`${backend_url}/getSummary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ course_id, subject_id }),
      });
      const data = await general_data.json();
      setSummary(data.summary);
    }
    if (token) {
      getData();
    }
  }, [token]);

  const router = useRouter();

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
  
      try {
        // Fetch logo image
        const response = await fetch("/logo2.png");
        const blob = await response.blob();
        const reader = new FileReader();
  
        reader.onloadend = () => {
          const logoDataURL = reader.result;
          generatePDF( logoDataURL);
          tempDiv.remove(); // Clean up cloned table
        };
  
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Failed to load logo:", error);
        generatePDF(logoDataURL);
        tempDiv.remove(); // Clean up cloned table
      }
    };
    
    const generatePDF = (logoDataURL) => {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
    
      // Date at top-left
      doc.setFontSize(8);
      doc.text(`${new Date().toLocaleString()}`, 10, 10);
    
      // Centered logo
      if (logoDataURL) {
        const logoWidth = 80;
        const logoHeight = 20;
        const logoX = (pageWidth - logoWidth) / 2;
        doc.addImage(logoDataURL, "PNG", logoX, 15, logoWidth, logoHeight);
      }
    
      // Certificate title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("E-LOGBOOK SUMMARY", pageWidth / 2, 40, { align: "center" });
  
    
      // Signature block
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Date : ${new Date().toLocaleDateString('en-GB')}`, 150, 50); 
      doc.text(`Student Name: ${student.name}`, 15, 60);
      doc.text(`Course Name: ${courses.find(course =>parseInt(course.course_id) === parseInt(course_id))?.course_name || "—"}`, 15, 70);
      doc.text(`Subject Name: ${subjects.find(subject =>parseInt(subject.subject_id) === parseInt(subject_id))?.subject_name || "—"}`, 15, 80);


      
    
      // Table data prep
      const body = summary.map((item, index) => [
        index + 1,
        item.skill || "-",
        `${item.fromDate} to ${item.toDate}`,
        item.skillWiseWork || "-",
        item.noOfProcedure || "-",
        
      ]);
    
      // Render table
      autoTable(doc, {
        startY: 95,
        head: [[
          "No.",
          "Skill",
          "Date",
          "Skill Wise Work",
          "Number"
        ]],
        body,
        styles: {
          fontSize: 9,
          cellPadding: 1,
          overflow: 'linebreak',
          valign: 'middle',
        },
        columnStyles: {
          0: { cellWidth: 10 },  // No.
          1: { cellWidth: 70 },  // From-To
          2: { cellWidth: 30 },  // Skill
          3: { cellWidth: 60 },  // Competency
          4: { cellWidth: 20 },  // Activity
          
        },      
        headStyles: {
          fillColor: [100, 100, 100],
        },
        margin: { top: 10, bottom: 15 },
        didDrawPage: function (data) {
          const pageNumber = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 5, {
            align: "center",
          });
        },
      });
    
      doc.save("ELogbook.pdf");
    };


  
  
  return (
    <div className={styles.main}>
      <Navbar onSubmit={handleStudentData} />

      <h2 className={styles.heading}>
        <Image src={"/icons/log.png"} width={50} height={50} alt="" />
        E-Logbook Summary
      </h2>

      {/* Actions Section */}
      <section className={styles.actionsSection}>
        <div>
          <button
            className={styles.actionsButton}
            onClick={() => {
              router.push("/student/home");
            }}
          >
            Back To Home
          </button>
        </div>
        <div>
          <button className={styles.actionsButton} onClick={downloadPDF}>
            <Image
              src={"/icons/print.png"}
              width={40}
              height={40}
              alt="search_icon"
            />
            Print
          </button>
        </div>
      </section>

      {/* Table Section */}
      <section className={styles.tableSection}>
        <table ref={tableRef} className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              <th className={styles.tableCell}>Skill Name</th>
              <th className={styles.tableCell}>Date</th>
              <th className={styles.tableCell}>Skill Wise Work</th>
              <th className={styles.tableCell}>Number</th>
            </tr>
          </thead>
          <tbody>
            {summary.length > 0 ? (
              summary.map((item, rowIndex) => (
                <tr key={rowIndex}>
                  <td className={styles.tableCell}>{item.skill || "-"}</td>
                  <td className={styles.tableCell}>
                    {item.fromDate} - {item.toDate}
                  </td>
                  <td className={styles.tableCell}>
                    {item.skillWiseWork || "-"}
                  </td>
                  <td className={styles.tableCell}>
                    {item.noOfProcedure || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="12"
                  className={`${styles.tableCell} ${styles.nofound}`}
                >
                  <p>No Items !</p>
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
export default function Dashboard() {
  return (
    <Suspense fallback={<Loading active={true} />}>
      <DashboardContent />
    </Suspense>
  );
}