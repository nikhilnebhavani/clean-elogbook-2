"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./logs.module.css";
import InputList from "@/components/InputList/page";
import Image from "next/image";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ManageLogs({ token }) {
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    active: false,
    type: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [add, setAdd] = useState(0);
  const [search, setSearch] = useState(false);
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
    const certText = `Logs Report generated from E-Logbook system. This document certifies that the logs contained herein have been recorded and verified by the faculty as part of the academic requirements. The details of each log, including student activities, competencies, skills, and faculty remarks, are presented in the following table for reference and record-keeping purposes.`;
    const splitText = doc.splitTextToSize(certText, 180);
    doc.text(splitText, 15, 50);
  
    // Signature block
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Course : ${course.title || ""}`, 15, 75);
    doc.text(`Subject : ${subject.title || ""}`, 15, 85);
    // doc.text("Countersigned by Head of the Department", 15, 115);
    // doc.text("Principal / Dean of the College", 15, 125);
    // doc.setFont("helvetica", "normal");
    // doc.text("Place :", 15, 135);
    // doc.text("Date :", 15, 142);  

  
    // Table data prep
    const body = logs.map((log, index) => [
      index + 1,
      students.find((e) => e._id == log.student_id).name || "-",
      `${log.fromDate} to ${log.toDate}`,
      skills.find((s) => s.skill_id == log.skill_id)?.skill_name || "-",
      competencies.find((s) => parseInt(s.competency_id) == parseInt(log.competency_id))?.competency_name || "-",
      log.nameOfActivity || "-",
      attemptActivities.find((e) => e.id === log.attemptActivity)?.title || "-",
      ratings.find((e) => e.id === log.rating)?.title || "-",
      decisions.find((e) => e.id === log.decisionOfFaculty)?.title || "-",
      log.initialFaculty ? `${log.initialFaculty} (${log.initialDate})` : "-",
      log.teacher_remark || "-",
    ]);
  
    // Render table
    autoTable(doc, {
      startY: 100,
      head: [[
        "No.",
	"Student Name",
        "From-To",
        "Skill",
        "Competency",
        "Activity",
        "Attempt",
        "Rating",
        "Decision",
        "Faculty & Date",
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
        8: { cellWidth: 15 },  // Faculty & Date
        9: { cellWidth: 18 },   // Feedback
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
   

  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [skills, setSkills] = useState([]);
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function getData() {
      const general_data = await fetch(`${backend_url}/getTGeneral`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await general_data.json();
      const activeCourses = (data.courses || []).filter(
        (course) => course.active === true // or just: course.active
      );
      setCourses(activeCourses);
      setSubjects(data.subjects);
      setCompetencies(data.competencies);
      setSkills(data.skills);
      setStudents(data.students);
    }
    if (token) {
      getData();
    }
  }, [token]);

  const [course, setCourse] = useState({ title: "", id: 0 });
  const [subject, setSubject] = useState({ title: "", id: 0 });
  const [competency, setCompetency] = useState({ title: "", id: 0 });
  const [skill, setSkill] = useState({ title: "", id: 0 });
  const [student, setStudent] = useState({ title: "", id: 0 });
  const [update, setUpdate] = useState("");
  const [updateLog, setUpdateLog] = useState({});
  const [updateFormData, setUpdateFormData] = useState({
    attemptActivity: 1,
    decisionOfFaculty: 1,
    rating: 1,
    teacher_remark: "",
  });
  const [showOptions, setShowOptions] = useState(false);
  const [showOptions2, setShowOptions2] = useState(false);
  const [showOptions3, setShowOptions3] = useState(false);
  const [showOptions4, setShowOptions4] = useState(false);
  const [showOptions5, setShowOptions5] = useState(false);

  const skillwiseworks = [
    { title: "Observed / Attended", id: 1 },
    { title: "Assisted", id: 2 },
    { title: "Done Under Supervision", id: 3 },
    { title: "Able to do Indepedently / Presented", id: 4 },
  ];

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

  const handlePopupClose = () => {
    if (popup.type == "success") {
      window.location.reload();
    } else {
      setPopup({
        active: false,
        type: "",
        message: "",
      });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (course.id == 0 && subject.id == 0) {
      setFirst(true);
    }
    try {
      const response = await fetch(`${backend_url}/getTLogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: course.id,
          subject_id: subject.id,
          student_id: student.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let logs2 = data.logs;
      if (competency.id > 0 && skill.id > 0) {
        logs2 = logs2.filter(
          (log) =>
            log.competency_id === competency.id && log.skill_id === skill.id
        );
      } else if (competency.id > 0) {
        logs2 = logs2.filter((log) => log.competency_id === competency.id);
      } else if (skill.id > 0) {
        logs2 = logs2.filter((log) => log.skill_id === skill.id);
      }

      setLogs(logs2);
      setSearch(true);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      alert("Failed to fetch logs. Please try again.");
    }
  };

  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]); // Deselect all
    } else {
      setSelectedRows(logs.map((e) => e._id)); // Select all
    }
    setSelectAll(!selectAll);
  };

  const handleRowSelect = (index) => {
    let updatedSelectedRows = [...selectedRows];

    if (updatedSelectedRows.includes(index)) {
      updatedSelectedRows = updatedSelectedRows.filter((i) => i !== index);
    } else {
      updatedSelectedRows.push(index);
    }

    setSelectedRows(updatedSelectedRows);
    setSelectAll(updatedSelectedRows.length === logs.length); // Check if all selected
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
        sortedData.sort((a, b) => a.verified - b.verified);
        break;
      case "verify":
        sortedData.sort((a, b) => b.verified - a.verified);
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

  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditClick = (log) => {
    setUpdate(log._id);
    setUpdateLog(log);
    setUpdateFormData({
      attemptActivity: log.attemptActivity || 1,
      decisionOfFaculty: log.decisionOfFaculty || 1,
      rating: log.rating || 1,
      teacher_remark: log.teacher_remark || "",
    });
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (update) {
        // Single log update case
        const body = {
          log_id: update,
          attemptActivity: updateFormData.attemptActivity,
          decisionOfFaculty: updateFormData.decisionOfFaculty,
          rating: updateFormData.rating,
          teacher_remark: updateFormData.teacher_remark,
        };

        const response = await fetch(`${backend_url}/updateTLog`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        if (response.ok) {
          setPopup({
            active: true,
            type: "success",
            message: "Log updated successfully.",
          });
          setUpdate(""); // Reset update state
          setUpdateLog({}); // Reset updateLog state
          setUpdateFormData({
            // Reset form data
            attemptActivity: "",
            decisionOfFaculty: "",
            rating: "",
            teacher_remark: "",
          });
        } else {
          setPopup({
            active: true,
            type: "error",
            message: data.error || "Log update failed.",
          });
        }
      } else {
        // Bulk verification case
        if (selectedRows.length === 0) {
          setPopup({
            active: true,
            type: "error",
            message: "Please select at least one log to verify.",
          });
          return;
        }

        const body = {
          logs: selectedRows,
        };

        const response = await fetch(`${backend_url}/updateTLog`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        if (response.ok) {
          setPopup({
            active: true,
            type: "success",
            message: "Logs verified successfully.",
          });
          setSelectedRows([]); // Reset selected rows
          setSelectAll(false); // Reset select all
        } else {
          setPopup({
            active: true,
            type: "error",
            message: data.error || "Verification failed.",
          });
        }
      }
    } catch (error) {
      setPopup({
        active: true,
        type: "error",
        message: "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString("en-GB"); // Output: "25/03/2025"
  };

  return (
    <div className={styles.mainBox}>
      <Loading active={loading} />
      <Popup
        active={popup.active}
        type={popup.type}
        message={popup.message}
        onClose={handlePopupClose}
      />
      {error != "" && <p className={styles.error}>{error}</p>}

      {!update ? (
        <>
          <form className={styles.form} onSubmit={handleSearch}>
            <div>
              <label>Course Name* :</label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => {
                  const newValue = e.target.value.trim();
                  if (newValue == "") {
                    setCourse({ title: "", id: 0 });
                    return;
                  }
                  setCourse({
                    title: e.target.value,
                    id: courses.find(
                      (course) => course.course_name === newValue
                    )
                      ? courses.find(
                          (course) => course.course_name === newValue
                        ).course_id
                      : 0,
                  });
                }}
                onFocus={() => setShowOptions(true)}
                onBlur={() => setTimeout(() => setShowOptions(false), 100)}
                placeholder="Type or Select Course Name..."
              />
              <InputList
                active={showOptions}
                options={courses}
                onSubmit={(option) => {
                  setCourse({
                    title: option.course_name,
                    id: option.course_id,
                  });
                }}
                value={course.title}
                type={"course"}
              />
            </div>
            <div>
              <label>Subject Name* :</label>
              <input
                type="text"
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
                options={
                  course.id != 0
                    ? subjects.filter(
                        (subject) => subject.course_id == course.id
                      )
                    : []
                }
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
              <label>Competency Name :</label>
              <input
                type="text"
                value={competency.title}
                onChange={(e) => {
                  const newValue = e.target.value.trim();
                  if (newValue == "") {
                    setCompetency({ title: "", id: 0 });
                    return;
                  }
                  setCompetency({
                    title: e.target.value,
                    id: competencies.find(
                      (competency) => competency.competency_name === newValue
                    )
                      ? subjects.find(
                          (competency) =>
                            competency.competency_name === newValue
                        ).subject_id
                      : 0,
                  });
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
                onSubmit={(subject) => {
                  setCompetency({
                    title: subject.competency_name,
                    id: subject.competency_id,
                  });
                }}
                value={competency.title}
                type={"competency"}
              />
            </div>
            <div>
              <label>Skill Name :</label>
              <input
                type="text"
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
                      ? subjects.find((skill) => skill.skill_name === newValue)
                          .subject_id
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
                  competency.id != 0
                    ? skills.filter(
                        (skill) => skill.competency_id == competency.id
                      )
                    : subject.id != 0
                    ? skills.filter((skill) => skill.subject_id == subject.id)
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
            <div>
              <label>Student Name :</label>
              <input
                type="text"
                value={student.title}
                onChange={(e) => {
                  const newValue = e.target.value.trim();
                  if (newValue == "") {
                    setStudent({ title: "", id: 0 });
                    return;
                  }
                  setStudent({
                    title: e.target.value,
                    id: students.find((student) => student.name === newValue)
                      ? students.find((student) => student.name === newValue)
                          ._id
                      : 0,
                  });
                }}
                onFocus={() => setShowOptions5(true)}
                onBlur={() => setTimeout(() => setShowOptions5(false), 100)}
                placeholder="Type or Select Student Name..."
              />
              <InputList
                active={showOptions5}
                options = {
                  subject.id !== 0
                    ? students.filter(
                        (student) =>
                          Array.isArray(student.courses) &&
                          student.courses.some(
                            (c) =>
                              c.course === (course.id).toString() &&
                              Array.isArray(c.subjects) &&
                              c.subjects.includes((subject.id).toString())
                          )
                      )
                    : course.id !== 0
                    ? students.filter(
                        (student) =>
                          Array.isArray(student.courses) &&
                          student.courses.some((c) => c.course === course.id)
                      )
                    : []
                }
                onSubmit={(student) => {
                  setStudent({
                    title: student.name,
                    id: student._id,
                  });
                }}
                value={student.title}
                type={"student"}
              />
            </div>

            <button
              className={styles.searchButton}
              style={
                add == 0 ? {} : { width: 0, height: 0, opacity: 0, margin: "0" }
              }
            >
              <Image
                src={"/icons/search.png"}
                width={50}
                height={50}
                alt="icon"
              />
              Search
            </button>
          </form>

          {search && (
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
                {selectedRows.length > 0 ? (
                  <button
                    className={styles.actionsButton}
                    onClick={handleLogSubmit}
                  >
                    <Image
                      src={"/icons/success.png"}
                      width={40}
                      height={40}
                      alt="search_icon"
                    />
                    verify
                  </button>
                ) : (
                  <></>
                )}
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
          {search && (
            <section className={styles.tableSection}>
              <table ref={tableRef} className={styles.table}>
                <thead>
                  <tr className={styles.tableHead}>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </td>

                    {[
                      "Sr. no",
                      "Student Name",
                      "From & To Date",
                      " Competency (Module)",
                      "Skill",
                      "Skill Wise Work",
                      "Name Of Activity",
                      "Link of Portfolio",
                      "Student Remark",
                      "Attempt Of Activity",
                      "Rating",
                      "Decision Of Faculty",
                      "Initial of Faculty & Date",
                      "Feedback Received",
                      "Remark",
                      "Verification",
                      "action",
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
                        <td className={styles.tableCell}>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(log._id)}
                            onChange={() => handleRowSelect(log._id)}
                          />
                        </td>
                        <td className={styles.tableCell}>{rowIndex + 1}</td>
                        <td className={styles.tableCell}>
                          {students.find((e) => e._id == log.student_id).name ||
                            "-"}
                        </td>
                        <td className={styles.tableCell}>
                          {log.fromDate + " : " + log.toDate}
                        </td>
                        <td className={styles.tableCell}>
                          {log.competency_id !== 0
                            ? competencies.find(
                                (e) => e.competency_id === log.competency_id
                              )?.competency_name || log.competency_id
                            : "-"}
                        </td>

                        <td className={styles.tableCell}>
                          {skills.find((e) => e.skill_id == log.skill_id)
                            ?.skill_name || "-"}
                        </td>
                        <td className={styles.tableCell}>
                          {skillwiseworks.find((e) => e.id == log.skillWiseWork)
                            .title || "-"}
                        </td>
                        <td className={styles.tableCell}>
                          {log.nameOfActivity}
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
                          {log.attemptActivity
                            ? attemptActivities.find(
                                (e) => e.id == log.attemptActivity
                              ).title
                            : "-"}
                        </td>
                        <td className={styles.tableCell}>
                          {log.rating
                            ? ratings.find((e) => e.id == log.rating).title
                            : "-"}
                        </td>
                        <td className={styles.tableCell}>
                          {log.decisionOfFaculty
                            ? decisions.find(
                                (e) => e.id == log.decisionOfFaculty
                              ).title
                            : "-"}
                        </td>
                        <td className={styles.tableCell}>
                          {log.verified
                            ? log.initialFaculty +
                              " - " +
                              formatDate(log.initialDate)
                            : "-"}
                        </td>
                        <td className={styles.tableCell}>
                          {log.feedbackRecivied ? "Yes" : "-"}
                        </td>
                        <td className={styles.tableCell}>
                          {log.teacher_remark || "-"}
                        </td>
                        <td className={styles.tableCell}>
                          <p
                            style={
                              !log.verified
                                ? { color: "red" }
                                : { color: "green" }
                            }
                          >
                            {log.verified ? "Verified" : "Not Verified"}
                          </p>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.edit}>
                            <div
                              className={styles.image}
                              onClick={() => handleEditClick(log)}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="18"
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
        </>
      ) : (
        <form className={styles.form} onSubmit={handleLogSubmit}>
          <div>
            <label>Course Name* :</label>
            <input
              type="text"
              value={
                courses.find((c) => parseInt(c.course_id) === updateLog.course_id)
                  ?.course_name || "-"
              }
              disabled
            />
          </div>
          <div>
            <label>Subject Name* :</label>
            <input
              type="text"
              value={
                subjects.find((s) => parseInt(s.subject_id) === updateLog.subject_id)
                  ?.subject_name || "-"
              }
              disabled
            />
          </div>
          <div>
            <label>Competency Name :</label>
            <input
              type="text"
              value={
                competencies.find(
                  (c) => c.competency_id === updateLog.competency_id
                )?.competency_name || "-"
              }
              disabled
            />
          </div>
          <div>
            <label>Skill Name :</label>
            <input
              type="text"
              value={
                skills.find((s) => s.skill_id === updateLog.skill_id)
                  ?.skill_name || "-"
              }
              disabled
            />
          </div>
          <div>
            <label>Student Name :</label>
            <input
              type="text"
              value={
                students.find((s) => s._id === updateLog.student_id)?.name ||
                "-"
              }
              disabled
            />
          </div>
          <div>
            <label>Skill Wise Work :</label>
            <input
              type="text"
              value={
                skillwiseworks.find((s) => s.id === updateLog.skillWiseWork)
                  ?.title || "-"
              }
              disabled
            />
          </div>
          <div>
            <label>No Of Time Procedure :</label>
            <input
              type="text"
              value={updateLog.noOfTimeProcedure || "-"}
              disabled
            />
          </div>
          <div>
            <label>From Date :</label>
            <input type="text" value={updateLog.fromDate || "-"} disabled />
          </div>
          <div>
            <label>To Date :</label>
            <input type="text" value={updateLog.toDate || "-"} disabled />
          </div>
          <div>
            <label>Name of Activity :</label>
            <input
              type="text"
              value={updateLog.nameOfActivity || "-"}
              disabled
            />
          </div>

          <div>
            <label>Link To Portfolio :</label>
            {updateLog.fileUrl ? (
              <a
                href={ updateLog.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View
              </a>
            ) : (
              <span>-</span>
            )}
          </div>
          <div>
            <label>Feedback Received :</label>
            <input
              type="text"
              value={updateLog.feedbackRecivied ? "Yes" : "No"}
              disabled
            />
          </div>
          <div>
            <label>Student Remark :</label>
            <input
              type="text"
              value={updateLog.student_remark || "-"}
              disabled
            />
          </div>

          <div>
            <label>Attempt Activity :</label>
            <select
              name="attemptActivity"
              value={updateFormData.attemptActivity}
              onChange={handleUpdateFormChange}
            >
              {attemptActivities.map((e) => {
                return (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label>Decision Of Faculty :</label>
            <select
              name="decisionOfFaculty"
              value={updateFormData.decisionOfFaculty}
              onChange={handleUpdateFormChange}
            >
              {decisions.map((e) => {
                return (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label>Rating :</label>
            <select
              name="rating"
              value={updateFormData.rating}
              onChange={handleUpdateFormChange}
            >
              {ratings.map((e) => {
                return (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label>Teacher Remark :</label>
            <input
              type="text"
              name="teacher_remark"
              value={updateFormData.teacher_remark}
              onChange={handleUpdateFormChange}
              placeholder="Type review for student..."
            />
          </div>

          <button className={styles.searchButton}>
            <Image
              src={"/icons/submit.png"}
              width={50}
              height={50}
              alt="icon"
            />
            Update
          </button>
        </form>
      )}
    </div>
  );
}
