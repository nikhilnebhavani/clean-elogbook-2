"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./Dashboard.module.css";
import Image from "next/image";
import Navbar from "@/components/navbar/page";
import { useRouter } from "next/navigation";
import InputList from "@/components/InputList/page";
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
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [skills, setSkills] = useState([]);

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
      setCompetencies(data.competencies || []);
      setSkills(data.skills || []);
      console.log(data.skills)
    }
    if (token) {
      getData();
    }
  }, [student]);

  const [first, setFirst] = useState(true);
  const router = useRouter();

  const [course, setCourse] = useState({ title: "", id: 0 });
  const [subject, setSubject] = useState({ title: "", id: 0 });
  const [competency, setCompetency] = useState({ title: "", id: 0 });
  const [skill, setSkill] = useState({ title: "", id: 0 });

  const [showOptions, setShowOptions] = useState(false);
  const [showOptions2, setShowOptions2] = useState(false);
  const [showOptions3, setShowOptions3] = useState(false);
  const [showOptions4, setShowOptions4] = useState(false);
  const [error, setError] = useState("");

  const [logs, setLogs] = useState([]);
  const handleSearch = async () => {
    if (
      course.id == 0 &&
      subject.id == 0 &&
      competency.id == 0 &&
      skill.id == 0
    ) {
      setFirst(true);
      setError("Please, Select Course And Subject First...");
      return;
    } else if (course.id == 0 || subject.id == 0) {
      setFirst(true);
      setError("Please, Select Course And Subject First...");
      return;
    } else {
      setError("");
    }
    try {
      const response = await fetch(`${backend_url}/getLogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: course.id,
          subject_id: parseInt(subject.id),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let logs2 = data.logs;
      if (skill.id != 0) {
        logs2 = logs2.filter((log) => log.skill_id == skill.id);
      }
      if (competency.id != 0) {
        logs2 = logs2.filter((log) => log.competency_id == competency.id);
      }
      setLogs(logs2);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      alert("Failed to fetch logs. Please try again.");
    }
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
    doc.text("E-LOGBOOK CERTIFICATE", pageWidth / 2, 40, { align: "center" });
  
    // Paragraph
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const certText = `This is to certify that the candidate Mr/Ms ${student.name}, Reg No. ${student.enroll} admitted in the year ${student.batchName} in the PIMS-LMS, has satisfactorily completed / has completed all assignments requirements mentioned in this logbook ${course.title} in the subject of ${subject.title}. She / He is eligible to appear for the summative (University) assessment as on the date given below.`;
    const splitText = doc.splitTextToSize(certText, 180);
    doc.text(splitText, 15, 50);
  
    // Signature block
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Signature of Faculty", 150, 95);
    doc.text("Name and Designation", 150, 105);
    doc.text("Countersigned by Head of the Department", 15, 115);
    doc.text("Principal / Dean of the College", 15, 125);
    doc.setFont("helvetica", "normal");
    doc.text("Place :", 15, 135);
    doc.text("Date :", 15, 142); 

  
    // Table data prep
    const body = logs.map((log, index) => [
      index + 1,
      `${log.fromDate} to ${log.toDate}`,
      skills.find((s) => s.skill_id == log.skill_id)?.skill_name || "-",
      competencies.find((s) => parseInt(s.competency_id) == parseInt(log.competency_id))?.competency_name || "-",
      log.nameOfActivity || "-",
      attemptActivities.find((e) => e.id === log.attemptActivity)?.title || "-",
      ratings.find((e) => e.id === log.rating)?.title || "-",
      decisions.find((e) => e.id === log.decisionOfFaculty)?.title || "-",
      log.initialFaculty ? `${log.initialFaculty} (${log.initialDate})` : "-",
      log.feedbackRecivied ? "Yes" : "-",
      log.teacher_remark || "-",
    ]);
  
    // Render table
    autoTable(doc, {
      startY: 150,
      head: [[
        "No.",
        "From-To",
        "Skill",
        "Competency",
        "Activity",
        "Attempt",
        "Rating",
        "Decision",
        "Faculty & Date",
        "Feedback",
        "Faculty Remark",
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
        1: { cellWidth: 20 },  // From-To
        2: { cellWidth: 20 },  // Skill
        3: { cellWidth: 22 },  // Competency
        4: { cellWidth: 25 },  // Activity
        5: { cellWidth: 15 },  // Attempt
        6: { cellWidth: 15 },  // Rating
        7: { cellWidth: 15 },  // Decision
        8: { cellWidth: 25 },  // Faculty & Date
        9: { cellWidth: 8 },   // Feedback
        10: { cellWidth: 15 }, // Faculty Remark
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
  
  
  
  
  
  
  const [selectedFilter, setSelectedFilter] = useState("");
  useEffect(() => {
    let sortedData = [...logs];

    switch (selectedFilter) {
      case "date":
        sortedData.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));
        break;
      case "redate":
        sortedData.sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
        break;
      case "noneVerify":
        sortedData.sort((a, b) => {
          return (a.verified === "" ? -1 : 1) - (b.verified === "" ? -1 : 1);
        });
        break;

      case "verify":
        sortedData.sort((a, b) => {
          return (a.verified !== "" ? -1 : 1) - (b.verified !== "" ? -1 : 1);
        });
        break;

      case "last":
        sortedData.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        break;
      default:
        break;
    }

    setLogs(sortedData);
  }, [selectedFilter]);

  const attemptActivities = [
    { title: "First Or Only", id: 1 },
    { title: "Repeat", id: 2 },
    { title: "Remedial", id: 3 },
    { title: "Not Applicable", id: 4 },
  ];

  const ratings = [
    { title: "Below Expectations", id: 1 },
    { title: "Meets Expectations", id: 2 },
    { title: "Exceeds Expectations", id: 3 },
    { title: "Not Applicable", id: 4 },
  ];

  const decisions = [
    { title: "Completed", id: 1 },
    { title: "Repeat", id: 2 },
    { title: "Remedial", id: 3 },
    { title: "Not Applicable", id: 4 },
  ];

  return (
    <div className={styles.main}>
      <Navbar onSubmit={handleStudentData} />

      <h2
        className={styles.heading}
        style={
          first
            ? {}
            : { width: "0px", height: "0px", opacity: "0", margin: "0" }
        }
      >
        <Image src={"/icons/log.png"} width={50} height={50} alt="" />
        E-Logbook
      </h2>

      {/* Search Section */}

      {error != "" && <p className={styles.error}>{error}</p>}

      <section className={styles.searchSection}>
        <div>
          <label>Course Name:</label>
          <input
            type="text"
            className={styles.searchInput}
            value={course.title}
            onChange={(e) => {
              const newValue = e.target.value.trim();

              if (newValue === "") {
                setCourse({ title: "", id: 0 });
                return;
              }

              const matchedCourse = courses.find(
                (course) => course.course_name === newValue
              );

              setCourse({
                title: e.target.value, // Keep original input value
                id: matchedCourse ? matchedCourse.course_id : 0, // Assign ID properly
              });
            }}
            onFocus={() => setShowOptions(true)}
            onBlur={() => setShowOptions(false)} // Directly setting state without delay
            placeholder="Type or Select Course Name..."
          />
          <InputList
            active={showOptions}
            options={courses}
            onSubmit={(option) => {
              setCourse({ title: option.course_name, id: option.course_id });
            }}
            value={course.title}
            type="course"
          />
        </div>

        <div>
          <label>Subject Name:</label>
          <input
            type="text"
            className={styles.searchInput}
            value={subject.title}
            onChange={(e) => {
              const newValue = e.target.value.trim();
              if (newValue == "") {
                setSubject({ title: "", id: 0 });
                return;
              }
              setSubject({
                title: e.target.value,
                id: subjects.find(
                  (subject) => subject.subject_name === newValue
                )
                  ? subjects.find(
                      (subject) => subject.subject_name === newValue
                    ).subject_id
                  : 0,
              });
            }}
            onFocus={() => setShowOptions2(true)}
            onBlur={() => setTimeout(() => setShowOptions2(false), 100)}
            placeholder="Type or Select Subject Name..."
          />
          <InputList
            active={showOptions2}
            options={course.id != 0 ? subjects : []}
            onSubmit={(subject) => {
              setSubject({
                title: subject.subject_name,
                id: subject.subject_id,
              });
            }}
            value={subject.title}
            type={"subject"}
          />
        </div>
        <div>
          <label>Competency (Module):</label>
          <input
            type="text"
            className={styles.searchInput}
            value={competency.title}
            onChange={(e) => {
              const newValue = e.target.value.trim();

              if (newValue === "") {
                setCompetency({ title: "", id: 0 });
                return;
              }

              const found = competencies.find(
                (competency) => competency.competency_name === newValue
              );

              if (found) {
                setCompetency({ title: newValue, id: found.competency_id });
                setSkill({ title: "", id: 0 }); // Reset skill when a valid competency is selected
              } else {
                setCompetency({ title: newValue, id: 0 });
              }
            }}
            onFocus={() => setShowOptions3(true)}
            onBlur={() => setTimeout(() => setShowOptions3(false), 100)}
            placeholder="Type or Select Competency Name..."
          />
          <InputList
            active={showOptions3}
            options={
              subject.id != 0
                ? competencies.filter(
                    (competency) => competency.subject_id == subject.id
                  )
                : []
            }
            onSubmit={(competency) => {
              setCompetency({
                title: competency.competency_name,
                id: competency.competency_id,
              });
              setSkill({ title: "", id: 0 });
            }}
            value={competency.title}
            type={"competency"}
          />
        </div>
        <div>
          <label>Skill:</label>
          <input
            type="text"
            className={styles.searchInput}
            value={skill.title}
            onChange={(e) => {
              const newValue = e.target.value.trim();
              if (newValue == "") {
                setSkill({ title: "", id: 0 });
                return;
              }
              setSkill({
                title: e.target.value,
                id: skills.find((skill) => skill.skill_name === newValue)
                  ? skills.find((skill) => skill.skill_name === newValue)
                      .skillt_id
                  : 0,
              });
            }}
            onFocus={() => setShowOptions4(true)}
            onBlur={() => setTimeout(() => setShowOptions4(false), 100)}
            placeholder="Type or Select Skill Name..."
          />
          <InputList
            active={showOptions4}
            options={
              subject.id != 0
                ? competency.id != 0
                  ? skills.filter(
                      (skill) => skill.competency_id == competency.id
                    )
                  : skills
                : []
            }
            onSubmit={(skill) => {
              setSkill({
                title: skill.skill_name,
                id: skill.skill_id,
              });
            }}
            value={skill.title}
            type={"skill"}
          />
        </div>

        <button
          className={styles.searchButton}
          onClick={() => {
            setFirst(false);
            handleSearch();
          }}
        >
          <Image
            src={"/icons/search.png"}
            width={40}
            height={40}
            alt="search_icon"
          />
          Search
        </button>
        <button
          className={styles.searchButton}
          onClick={() => router.push("/student/add")}
        >
          <Image
            src={"/icons/add.png"}
            width={40}
            height={40}
            alt="search_icon"
          />
          Add Log
        </button>
        <button
          className={styles.searchButton}
          style={first ? { display: "none" } : {}}
          onClick={() => {
            router.push(`/student/score?ci=${course.id}&si=${subject.id}`);
          }}
        >
          <Image
            src={"/icons/scorecard.png"}
            width={40}
            height={40}
            alt="search_icon"
          />
          Score
        </button>
        <button
          className={styles.searchButton}
          style={first ? { display: "none" } : {}}
          onClick={() => {
            router.push(`/student/summary?ci=${course.id}&si=${subject.id}`);
          }}
        >
          <Image
            src={"/icons/summary.png"}
            width={40}
            height={40}
            alt="search_icon"
          />
          Summary
        </button>
      </section>

      {/* Actions Section */}
      {!first && (
        <section className={styles.actionsSection}>
          <div>
            <label>Sort By :</label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value={""} disabled>
                select
              </option>
              <option value={"date"}>Date</option>
              <option value={"redate"}>Reverse Date</option>
              <option value={"noneVerify"}>None Verified</option>
              <option value={"verify"}>Verified</option>
              <option value={"last"}>Last Added</option>
            </select>
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
      )}

      {/* Table Section */}
      {!first && (
        <section className={styles.tableSection}>
          <table ref={tableRef} className={styles.table}>
            <thead>
              <tr className={styles.tableHead}>
                {[
                  "No.",
                  "From Date To Date",
                  "Competency",
                  "Skill",
                  "Name of Activity (Topic)",
                  "Attempt Activity",
                  "Rating",
                  "Decision Of Faculty",
                  "Initial Of Faculty & Date",
                  "Feedback Received",
                  "Faculty Remark",
                  "Link of Portfolio",
                  "Student Remark",
                  "Action",
                ].map((heading) => (
                  <th key={heading} className={styles.tableCell}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className={styles.tableCell}>{rowIndex + 1}</td>
                    <td className={styles.tableCell}>
                      {log.fromDate + " : " + log.toDate}
                    </td>
                    <td className={styles.tableCell}>
                      {competencies.find((competency) => log.competency_id == competency.competency_id)
                        ?.competency_name || log.competency_id}
                    </td>
                    <td className={styles.tableCell}>
                      {skills.find((skill) => log.skill_id == skill.skill_id)
                        ?.skill_name || log.skill_id}
                    </td>
                    <td className={styles.tableCell}>
                      {log.nameOfActivity || "-"}
                    </td>
                    <td className={styles.tableCell}>
                      {attemptActivities.find(
                        (e) => e.id === log.attemptActivity
                      )?.title || "-"}
                    </td>
                    <td className={styles.tableCell}>
                      {ratings.find((e) => e.id === log.rating)?.title || "-"}
                    </td>
                    <td className={styles.tableCell}>
                      {decisions.find((e) => e.id === log.decisionOfFaculty)
                        ?.title || "-"}
                    </td>
                    <td className={styles.tableCell}>
                      {log.initialFaculty
                        ? log.initialFaculty + " " + log.initialDate
                        : "-"}
                    </td>

                    <td className={styles.tableCell}>
                      {(log.feedbackRecivied && "Yes") || "-"}
                    </td>
                    <td className={styles.tableCell}>
                      {log.teacher_remark || "-"}
                    </td>
                    <td className={styles.tableCell}>
                      {log.fileUrl == "" ? (
                        <p>-</p>
                      ) : (
                        <a
                          href={log.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      )}
                    </td>
                    <td className={styles.tableCell}>
                      {log.student_remark || "-"}
                    </td>
                    <td className={styles.tableCell}>
                      {/*{log.verified ? (
                        <p className={styles.verified}>Verified</p>
                      ) : (
                        <div className={styles.edit}>
                          <div
                            className={styles.image}
                            onClick={() => {
                              router.push(`/student/add?log=${log._id}`);
                            }}
                          ></div>
                        </div>
                      )}*/}
                   <div className={styles.edit}>
                        <div
                          className={styles.image}
                          onClick={() => {
                            router.push(`/student/add?log=${log._id}`);
                          }}
                        ></div>
                      </div> </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="13"
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
      )}
    </div>
  );
}
