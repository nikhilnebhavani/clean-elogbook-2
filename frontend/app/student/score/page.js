"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import styles from "./Score.module.css";
import Image from "next/image";
import Navbar from "@/components/navbar/page";
import { useRouter, useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Dashboard() {
  const [student, setStudent] = useState([]);
  const [token, setToken] = useState("");
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleStudentData = (studentData) => {
    setStudent(studentData);
    setToken(studentData.token);
  };

  const [scores, setScores] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [course_id, setCourseID] = useState(0);
  const [subject_id, setSubjectID] = useState(0);

  function SearchParamsComponent() {
    const searchParams = useSearchParams();
    useEffect(() => {
      const ci = parseInt(searchParams.get("ci"));
      const si = parseInt(searchParams.get("si"));
      setCourseID(ci);
      setSubjectID(si);
    }, [searchParams]);
    return null;
  }

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
    if (token) getData();
  }, [student]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function getData() {
      const r = await fetch(`${backend_url}/getScore`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await r.json();
      setScores(data.score || []);
    }
    if (token) getData();
  }, [token]);

  const router = useRouter();
  const tableRef = useRef(null);

  // Map a numeric score (1..9) to 9 cells with a ✓ at the scored index
  const scoreToColumns = (score) => {
    const cols = Array(9).fill("");
    if (typeof score === "number" && score >= 1 && score <= 9) {
      cols[score - 1] = "✓";
    }
    return cols;
  };
const downloadPDF = async () => {
  // helper: 1..9 → array of 9 cells with "✓" in the picked one
  const toNine = (score) => {
    const cols = Array(9).fill("");
    if (typeof score === "number" && score >= 1 && score <= 9) {
      cols[score - 1] = "✓"; // Using checkmark symbol
    }
    return cols;
  };

  // optional logo
  let logoDataURL;
  try {
    const res = await fetch("/logo2.png");
    if (res.ok) {
      const blob = await res.blob();
      logoDataURL = await new Promise((resolve) => {
        const fr = new FileReader();
        fr.onloadend = () => resolve(fr.result);
        fr.readAsDataURL(blob);
      });
    }
  } catch (_) {}

  const course =
    (courses.find((e) => parseInt(e.course_id) === course_id) || {})
      ?.course_name || "-";
  const subject =
    (subjects.find((e) => parseInt(e.subject_id) === subject_id) || {})
      ?.subject_name || "-";

  // rows for selected subject
  const rows = [];
  let sr = 0;
  (scores || []).forEach((sc) => {
    if (sc.subject_id === subject_id) {
      (sc.arr || []).forEach((item) => {
        sr += 1;
        rows.push({
          sr,
          title: item.title || "-",
          nine: toNine(item.score),
          comment: item.comment || "-",
        });
      });
    }
  });

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // date
  doc.setFontSize(8);
  doc.text(new Date().toLocaleString(), 10, 10);

  // logo
  if (logoDataURL) {
    const w = 80,
      h = 20,
      x = (pageWidth - w) / 2;
    doc.addImage(logoDataURL, "PNG", x, 15, w, h);
  }

  // main heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("E-LOGBOOK SCORING", pageWidth / 2, 40, { align: "center" });

  // centered subheading
  doc.setFontSize(12);
  doc.text(
    `Student Appraisal Form For ${course} In ${subject}`,
    pageWidth / 2,
    50,
    { align: "center" }
  );

  // meta
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Student Name: ${student?.name || "-"}`, 15, 58);
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 150, 58);

  // table data
  const head = [
    [
      { content: "Sr No.", rowSpan: 2 },
      { content: "Elements", rowSpan: 2 },
      { content: "Less than Satisfactory", colSpan: 3 },
      { content: "Satisfactory", colSpan: 3 },
      { content: "More than Satisfactory", colSpan: 3 },
      { content: "Comments", rowSpan: 2 },
    ],
    ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  ];
  const body = rows.map((r) => [r.sr, r.title, ...r.nine, r.comment]);

  autoTable(doc, {
    startY: 64,
    head,
    body,
    theme: "grid",
    margin: { left: 10, right: 10 },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2,
      valign: "middle",
      overflow: "linebreak",
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 40 },
      2: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 10, halign: "center" },
      4: { cellWidth: 10, halign: "center" },
      5: { cellWidth: 10, halign: "center" },
      6: { cellWidth: 10, halign: "center" },
      7: { cellWidth: 10, halign: "center" },
      8: { cellWidth: 10, halign: "center" },
      9: { cellWidth: 10, halign: "center" },
      10: { cellWidth: 10, halign: "center" },
      11: { cellWidth: 45 },
    },
    didDrawCell: (data) => {
      // Draw checkmark for cells containing "✓"
      if (data.cell.text && data.cell.text[0] === "✓") {
        const doc = data.doc;
        const cellX = data.cell.x;
        const cellY = data.cell.y;
        const cellWidth = data.cell.width;
        const cellHeight = data.cell.height;

        // Calculate checkmark position (centered in cell)
        const centerX = cellX + cellWidth / 2;
        const centerY = cellY + cellHeight / 2;

        // Draw checkmark using lines
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.8);

        // First line of checkmark (short diagonal down-right)
        doc.line(centerX - 2, centerY, centerX - 0.5, centerY + 1.5);
        // Second line of checkmark (longer diagonal up-right)
        doc.line(centerX - 0.5, centerY + 1.5, centerX + 2.5, centerY - 2);

        // Clear the text so "✓" doesn't show as text
        data.cell.text = [""];
      }
    },
    didDrawPage: () => {
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 5, {
        align: "center",
      });
    },
    rowPageBreak: "avoid",
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // bold footer labels
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Name and Signature of the Assessee", 15, finalY + 20);
  doc.text("Date", 15, finalY + 27);
  doc.text("Name and Signature of the Assessor", 120, finalY + 20);
  doc.text("Date", 120, finalY + 27);

  // prompt
  doc.setFont("helvetica", "normal");
  doc.text(
    "Has this assessment pattern been discussed with the trainee?  Yes     No",
    15,
    finalY
  );
  doc.text("If not explain", 15, finalY + 8);

  // DONE
  doc.save("ELogbook_Scoring.pdf");
};





  const courseName =
    (courses.find((e) => parseInt(e.course_id) === course_id) || {})
      .course_name || "-";
  const subjectName =
    (subjects.find((e) => parseInt(e.subject_id) === subject_id) || {})
      .subject_name || "-";

  return (
    <div className={styles.main}>
      <Suspense fallback={<div>Loading...</div>}>
        <SearchParamsComponent />
      </Suspense>

      <Navbar onSubmit={handleStudentData} />

      <h2 className={styles.heading}>
        <Image src={"/icons/log.png"} width={50} height={50} alt="" />
        E-Logbook Scoring
      </h2>

      <section className={styles.actionsSection}>
        <div>
          <button
            className={styles.actionsButton}
            onClick={() => router.push("/student/home")}
          >
            back to home
          </button>
        </div>
        <div>
          <button className={styles.actionsButton} onClick={downloadPDF}>
            <Image
              src={"/icons/print.png"}
              width={40}
              height={40}
              alt="print"
            />
            Print
          </button>
        </div>
      </section>

      <section className={styles.tableSection}>
        <p className={styles.tableHeading}>
          Score of {subjectName} From {courseName}
        </p>

        <table ref={tableRef} className={styles.table}>
          <thead>
            {/* Grouped header */}
            <tr className={styles.tableHead}>
              <th className={styles.tableCell} rowSpan={2}>
                Sr No.
              </th>
              <th className={styles.tableCell} rowSpan={2}>
                Elements
              </th>
              <th className={styles.tableCell} colSpan={3}>
                Less than Satisfactory
              </th>
              <th className={styles.tableCell} colSpan={3}>
                Satisfactory
              </th>
              <th className={styles.tableCell} colSpan={3}>
                More than Satisfactory
              </th>
              <th className={styles.tableCell} rowSpan={2}>
                Comments
              </th>
            </tr>
            {/* 1..9 */}
            <tr className={styles.tableHead}>
              {Array.from({ length: 9 }, (_, i) => (
                <th key={`num-${i}`} className={styles.tableCell}>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {scores && scores.length > 0 ? (
              scores.flatMap((score) =>
                score.subject_id === subject_id
                  ? (score.arr || []).map((arr, idx) => {
                      const nine = scoreToColumns(arr.score);
                      return (
                        <tr key={`r-${idx}`}>
                          <td className={styles.tableCell}>{idx + 1}</td>
                          <td className={styles.tableCell}>{arr.title}</td>
                          {nine.map((v, i) => (
                            <td
                              key={`c-${idx}-${i}`}
                              className={styles.tableCell}
                              style={{ textAlign: "center" }}
                            >
                              {v}
                            </td>
                          ))}
                          <td className={styles.tableCell}>
                            {arr.comment || "-"}
                          </td>
                        </tr>
                      );
                    })
                  : []
              )
            ) : (
              <tr>
                <td
                  colSpan={13}
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

