"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./logs.module.css";
import InputList from "@/components/InputList/page";
import Image from "next/image";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ManageLogs({token}) {
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


  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [skills, setSkills] = useState([]);
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);



  useEffect(() => {
    async function getData() {
      const general_data = await fetch(`${backend_url}/getAGeneral`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await general_data.json();
      setCourses(data.courses);
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
  const [showOptions, setShowOptions] = useState(false);
  const [showOptions2, setShowOptions2] = useState(false);
  const [showOptions3, setShowOptions3] = useState(false);
  const [showOptions4, setShowOptions4] = useState(false);
  const [showOptions5, setShowOptions5] = useState(false);

  const skillwiseworks = [
    {title : "Observed / Attended", id:1},
    {title : "Assited", id:2},
    {title : "Done Under Supervision", id:3},
    {title : "Able to do Indepedently / Presented", id:4},

  ];


  const handlePopupClose = () => {
    if (popup.type == "success") {
      window.location.reload()
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
        const response = await fetch(`${backend_url}/getALogs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            course_id: course.id,
            subject_id: subject.id,
            student_id: student._id,
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
         setSelectedRows(logs.map((_, index) => index)); // Select all
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
       useEffect(()=>{
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
       },[selectedFilter])

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
      <form
        className={styles.form}
        onSubmit={add != 0 ? handleLogSubmit : handleSearch}
      >
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
                id: courses.find((course) => course.course_name === newValue)
                  ? courses.find((course) => course.course_name === newValue)
                      .course_id
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
              setCourse({ title: option.course_name, id: option.course_id });
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
                      (competency) => competency.competency_name === newValue
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
            options={subject.id != 0 ? competencies : []}
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
            options={subject.id != 0 ? skills : []}
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
                  ? students.find((student) => student.name === newValue)._id
                  : 0,
              });
            }}
            onFocus={() => setShowOptions5(true)}
            onBlur={() => setTimeout(() => setShowOptions5(false), 100)}
            placeholder="Type or Select Student Name..."
          />
          <InputList
            active={showOptions5}
            options={subject.id != 0 ? students : []}
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
          <Image src={"/icons/search.png"} width={50} height={50} alt="icon" />
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
            {selectedRows.length > 0 ? <button className={styles.actionsButton}>
              <Image
                src={"/icons/success.png"}
                width={40}
                height={40}
                alt="search_icon"
              />
              verify
            </button> : <></> }
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
        <section
          className={styles.tableSection}
          style={add == 0 ? {} : { width: 0, height: 0, opacity: 0 }}
        >
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
                  "Competency (Module)",
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
                      {log.student_name ||
                        "-"}
                    </td>
                    <td className={styles.tableCell}>
                      {log.fromDate + "-" + log.toDate}
                    </td>
                    <td className={styles.tableCell}>
                      {competencies.find(
                        (e) => e.competency_id == log.competency_id
                      ).competency_name || "-"}
                    </td>
                    <td className={styles.tableCell}>
                      {skills.find((e) => e.skill_id == log.skill_id)
                        .skill_name || "-"}
                    </td>
                    <td className={styles.tableCell}>
                      {skillwiseworks.find((e) => e.id == log.skillWiseWork)
                        .title || "-"}
                    </td>
                    <td className={styles.tableCell}>{log.nameOfActivity}</td>
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
                      {log.attemptActivity || "-"}
                    </td>
                    <td className={styles.tableCell}>{log.rating || "-"}</td>
                    <td className={styles.tableCell}>
                      {log.decisionOfFaculty || "-"}
                    </td>
                    <td className={styles.tableCell}>
                      {log.initialOfFacultyDate || "-"}
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
                          !log.verified ? { color: "red" } : { color: "green" }
                        }
                      >
                        {log.verified ? "Verified" : "Not Verified"}
                      </p>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.edit}>
                        <div
                          className={styles.image}
                          onClick={() => {
                            setSkill(skill.skill_name);
                            setCompetency({
                              title: competencies.find(
                                (e) => e.competency_id == skill.competency_id
                              ).competency_name,
                              id: skill.competency_id,
                            });
                            setAdd(1);
                          }}
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
    </div>
  );
}
