"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./scoring.module.css";
import InputList from "@/components/InputList/page";
import Image from "next/image";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Scoring({token}) {
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
  const [editMode, setEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
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
         pdf.addImage(logoDataURL, "PNG", logoX, logoY, logoWidth, logoHeight);
       }

       // Add heading
       pdf.setFontSize(18);
       pdf.text("Logs Report", 105, 40, { align: "center" });

       // Add table image
       const imgWidth = 190;
       const imgHeight = (canvas.height * imgWidth) / canvas.width;
       pdf.addImage(imgData, "PNG", 10, 50, imgWidth, imgHeight);

       pdf.save("logs.pdf");
     });
   };


  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [scoreCard, setScoreCard] = useState([]);
  const [scores, setScores] = useState([]);
  const [filtertitles, setFilterTitles] = useState([]);



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
      setStudents(data.students);
      setScoreCard(data.scorecard);

    }
    if (token) {
      getData();
    }
  }, [token]);

  const [course, setCourse] = useState({ title: "", id: 0 });
  const [subject, setSubject] = useState({ title: "", id: 0 });
  const [student, setStudent] = useState({ title: "", id: 0 });
  const [showOptions, setShowOptions] = useState(false);
  const [showOptions2, setShowOptions2] = useState(false);
  const [showOptions5, setShowOptions5] = useState(false);


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
        setError("fill all mandatory fields");
        return;
      }
      setError("");
      setLoading(true);
      try {
        const response = await fetch(`${backend_url}/getTScore`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject_id: parseInt(subject.id),
            student_id: student.id,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setScores(data.scores);
        setFilterTitles(
          scoreCard.filter((e) => e.subject_id == subject.id)[0].titles
        );
        setSearch(true);
      } catch (error) {
        setPopup({
          active: true,
          type: "error",
          message: "Failed to fetch scores. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

  const handleScoreUpdate = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    console.log(selectedStudent)
    setLoading(true);
    try {
      // Update each score individually
      for (const score of selectedStudent.scores) {
        const response = await fetch(`${backend_url}/updateTScore`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject_id: subject.id,
            selectedStudent,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to update score");
        }
      }

      setPopup({
        active: true,
        type: "success",
        message: "Scores updated successfully",
      });
      setEditMode(false);
      setSelectedStudent(null);
      // Refresh the scores
      handleSearch(e);
    } catch (error) {
      setPopup({
        active: true,
        type: "error",
        message: error.message || "Failed to update scores",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (score) => {
    setSelectedStudent({
      id: score.student_id,
      name: score.name,
      scores: score.scorecard.arr.map(item => ({
        title: item.title,
        score: parseInt(item.score) || 0,
        comment: item.comment || ""
      }))
    });
    setEditMode(true);
  };

  const handleScoreChange = (title, field, value) => {
    if(field === 'score') {
      setSelectedStudent((prev) => ({
        ...prev,
        scores: prev.scores.map((score) =>
          score.title === title
            ? { ...score, [field]: parseInt(value) || 0 }
            : score
        ),
      }));
    }
    else{
      setSelectedStudent((prev) => ({
        ...prev,
        scores: prev.scores.map((score) =>
          score.title === title
            ? { ...score, [field]: value }
            : score
        ),
      }));
    }
    
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
      <form
        className={styles.form}
        onSubmit={handleSearch}
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
          type="submit"
        >
          <Image src={"/icons/search.png"} width={50} height={50} alt="icon" />
          Search
        </button>
      </form>

      {search && !editMode && (
        <section className={styles.actionsSection}>
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
      {search && (
        <section className={styles.tableSection}>
          {editMode ? (
            <div className={styles.editForm}>
              <h2>Update Scores for {selectedStudent?.name}</h2>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHead}>
                      <th className={styles.tableCell}>Title</th>
                      <th className={styles.tableCell}>Score</th>
                      <th className={styles.tableCell}>Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent?.scores.map((score, index) => (
                      <tr key={index}>
                        <td className={styles.tableCell}>{score.title}</td>
                        <td className={styles.tableCell}>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={score.score}
                            onChange={(e) => handleScoreChange(score.title, 'score', e.target.value)}
                            required
                          />
                        </td>
                        <td className={styles.tableCell}>
                          <textarea
                            value={score.comment}
                            onChange={(e) => handleScoreChange(score.title, 'comment', e.target.value)}
                            placeholder="Enter comment..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.formActions}>
                  <button onClick={handleScoreUpdate} className={styles.submit}>
                    <Image src="/icons/submit.png" width={30} height={30} alt="submit" />
                    Save Changes
                  </button>
                  <button type="button" className={styles.close} onClick={() => {
                    setEditMode(false);
                    setSelectedStudent(null);
                  }}>
                    <Image src="/icons/back.png" width={30} height={30} alt="cancel" />
                    Cancel
                  </button>
                </div>
            </div>
          ) : (
            <table ref={tableRef} className={styles.table}>
              <thead>
                <tr className={styles.tableHead}>
                  <th className={styles.tableCell}>Sr. no</th>
                  <th className={styles.tableCell}>Student Name</th>
                  {filtertitles.map((heading, index) => (
                    <th key={index} className={styles.tableCell}>
                      {heading}
                    </th>
                  ))}
                  <th className={styles.tableCell}>Action</th>
                </tr>
              </thead>
              <tbody>
                {scores.length > 0 ? (
                  scores.map((score, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className={styles.tableCell}>{rowIndex + 1}</td>
                      <td className={styles.tableCell}>{score.name}</td>
                      {filtertitles.map((title, index) => {
                        const foundScore = score.scorecard.arr.find(
                          (e) => e.title === title
                        );
                        return (
                          <td key={index} className={styles.tableCell}>
                            {foundScore ? foundScore.score : "-"}
                          </td>
                        );
                      })}
                      <td className={styles.tableCell}>
                        <div className={styles.edit}>
                          <button onClick={() => handleEditClick(score)}>
                            Edit
                          </button>
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
          )}
        </section>
      )}
    </div>
  );
}
