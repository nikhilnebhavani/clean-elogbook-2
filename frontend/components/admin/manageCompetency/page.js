"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./competency.module.css";
import InputList from "@/components/InputList/page";
import Image from "next/image";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import * as XLSX from "xlsx";

export default function ManageCompetency({token}) {
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
  const [editId, setEditId] = useState(null);

  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [filtercompetencies, setFilterCompetencies] = useState([]);

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
    }
    if (token) {
      getData();
    }
  }, [token]);

  const [course, setCourse] = useState({ title: "", id: 0 });
  const [subject, setSubject] = useState({ title: "", id: 0 });
  const [competency, setCompetency] = useState("");
  const [fileData, setFileData] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showOptions2, setShowOptions2] = useState(false);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (add==1 && (course.id == 0 || subject.id == 0 || competency == "")) {
      setError("fill all mandatory fields");
      return;
    }
    else if (add == 2 && (course.id == 0 || subject.id == 0 || fileData.length<=0)){
      setError("fill all mandatory fields");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const body = {
        course_id: course.id,
        subject_id: subject.id,
        competency,
        add,
        fileData,
      };

      const add_log = await fetch(`${backend_url}/addACompetency`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await add_log.json();
      if (add_log.ok) {
        setPopup({
          active: true,
          type: "success",
          message:
            add == 1 ? "Competency" : "Competencies" + "added successfully.",
        });
        setLoading(false);
      } else {
        setPopup({
          active: true,
          type: "error",
          message: data.error || add == 1 ? "Competency" : "Competencies" + "adding failed.",
        });
        setLoading(false);
      }
    } catch (error) {
      setPopup({
        active: true,
        type: "error",
        message: add == 1 ? "Competency" : "Competencies" + "adding failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePopupClose = () => {
    if (popup.type === "success") {
      window.location.reload();
    } else {
      setPopup({
        active: false,
        type: "",
        message: "",
      });
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) return;
    if (!file.name.endsWith(".xlsx")) {
      alert("Please upload an Excel file (.xlsx)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setFileData(jsonData);
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadFile = () => {
    const fileUrl = "/examples/competency.xlsx"; // Adjust path if needed
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "competency.xlsx"; // Optional: Rename file upon download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSearch = (e) =>{
    e.preventDefault();
    if (course.id == 0 || subject.id == 0) {
      setError("fill all mandatory fields");
      return;
    }
    setError("")
    setSearch(true);
    setFilterCompetencies(competencies.filter((e)=>e.subject_id==subject.id))
  }

  const toggleActive = async (competency) => {
    setLoading(true);
    try {
      console.log("Toggling competency:", competency);
      
      const newActiveState = !competency.active;
      
      const response = await fetch(`${backend_url}/updateACompetency`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          competency_id: competency.competency_id,
          active: newActiveState
        }),
      });

      const result = await response.json();
      console.log("Response from server:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to update competency status");
      }

      setPopup({
        active: true,
        type: "success",
        message: `Competency ${competency.active ? "deactivated" : "activated"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling competency status:", error);
      setPopup({
        active: true,
        type: "error",
        message: "Failed to update competency status: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditClick = (competency) => {
    setCompetency(competency.competency_name);
    setCourse({
      title: subjects.find(s => s.subject_id === competency.subject_id)?.course_name || "",
      id: subjects.find(s => s.subject_id === competency.subject_id)?.course_id || 0
    });
    setSubject({
      title: subjects.find(s => s.subject_id === competency.subject_id)?.subject_name || "",
      id: competency.subject_id
    });
    setEditId(competency.competency_id);
    setAdd(1);
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
      <div className={styles.head}>
        <button
          type="button"
          onClick={() => {
            setAdd(1);
          }}
          className={styles.add}
        >
          <Image src={"/icons/add.png"} width={25} height={25} alt="icon" />
          Add Competency
        </button>
        <button
          type="button"
          onClick={() => {
            setAdd(2);
          }}
          className={styles.add}
        >
          <Image src={"/icons/add.png"} width={25} height={25} alt="icon" />
          Add Bulk Competencies
        </button>
        <button
          type="button"
          onClick={() => downloadFile()}
          className={styles.add}
        >
          <Image src={"/icons/submit.png"} width={25} height={25} alt="icon" />
          Excel Prototype
        </button>
      </div>
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
        <div style={add == 1 ? {} : { width: 0, height: 0, opacity: 0 }}>
          <label>Competency (Module)* :</label>
          <input
            type="text"
            value={competency}
            onChange={(e) => {
              const newValue = e.target.value;
              setCompetency(newValue);
            }}
            placeholder="Type Competency Name..."
          />
        </div>
        <div style={add == 2 ? {} : { width: 0, height: 0, opacity: 0 }}>
          <label>File:</label>
          <label htmlFor="file-upload" className={styles.file_label}>
            <Image
              src={
                !fileData.length > 0
                  ? "/icons/upload.png"
                  : "/icons/success.png"
              }
              width={30}
              height={30}
              alt="icon"
            />
            {fileData.length > 0 ? "Uploaded... change ?" : "Upload File"}
          </label>
          <input
            type="file"
            id="file-upload"
            accept=".xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileChange}
          />
        </div>
        <button
          className={styles.searchButton}
          style={
            add == 0
              ? { margin: "35px 0  0 5vw" }
              : { width: 0, height: 0, opacity: 0, margin: "0" }
          }
        >
          <Image src={"/icons/search.png"} width={50} height={50} alt="icon" />
          Search
        </button>
        <button style={add != 0 ? {} : { width: 0, height: 0, opacity: 0 }}>
          <Image src={"/icons/submit.png"} width={50} height={50} alt="icon" />
          Submit
        </button>
        {add != 0 && <div></div>}
        <button
          type="button"
          onClick={() => {
            setAdd(0);
          }}
          style={
            add != 0
              ? {
                  background: "white",
                  border: "1px solid black",
                  color: "black",
                }
              : { width: 0, height: 0, opacity: 0 }
          }
        >
          <Image src={"/icons/back.png"} width={30} height={30} alt="icon" />
          Close
        </button>
      </form>

      {search && (
        <section
          className={styles.tableSection}
          style={add === 0 ? {} : { width: 0, height: 0, opacity: 0 }}
        >
          <table ref={tableRef} className={styles.table}>
            <thead>
              <tr className={styles.tableHead}>
                {[
                  "No",
                  "Subject Name",
                  "Competency Name",
                  "Created At",
                  "Updated At",
                  "Actions"
                ].map((heading) => (
                  <th key={heading} className={styles.tableCell}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtercompetencies.length > 0 ? (
                filtercompetencies.map((competency, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className={styles.tableCell}>{rowIndex + 1}</td>
                    <td className={styles.tableCell}>
                      {
                        subjects.find(
                          (e) => e.subject_id === competency.subject_id
                        )?.subject_name || "Unknown Subject"
                      }
                    </td>
                    <td className={styles.tableCell}>
                      {competency.competency_name}
                    </td>
                    <td className={styles.tableCell}>
                      {competency.created_at ? new Date(competency.created_at).toLocaleString() : "N/A"}
                    </td>
                    <td className={styles.tableCell}>
                      {competency.updated_at ? new Date(competency.updated_at).toLocaleString() : "N/A"}
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleEditClick(competency)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(competency)}
                          className={competency.active ? styles.inactiveButton : styles.activeButton}
                        >
                          {competency.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
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
      )}
    </div>
  );
}
