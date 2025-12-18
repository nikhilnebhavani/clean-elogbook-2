"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./manageSubjects.module.css";
import InputList from "@/components/InputList/page";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import Image from "next/image";
import * as XLSX from "xlsx";

export default function ManageSubjects({ token, data }) {
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    active: false,
    type: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [add, setAdd] = useState(0); // 0: search mode, 1: single add, 2: bulk add
  const [search, setSearch] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [filterSubjects, setFilterSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    subject_name: "",
    course_id: "",
  });
  const [editId, setEditId] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [course, setCourse] = useState({ title: "", id: 0 });
  const [showOptions, setShowOptions] = useState(false);
  const tableRef = useRef(null);
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch courses and subjects
      const response = await fetch(`${backend_url}/getAGeneral`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log("Received subjects:", data.subjects);
      if (data.subjects && data.subjects.length > 0) {
        console.log("Sample subject:", data.subjects[0]);
        console.log("Has active property:", data.subjects[0].hasOwnProperty('active'));
      }
      
      setCourses(data.courses || []);
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (course.id === 0) {
      setError("Please select a course");
      return;
    }
    setError("");
    setSearch(true);
    
    // Filter subjects by course_id and add course_name from courses array
    const filtered = subjects
      .filter((s) => s.course_id === course.id)
      .map(subject => {
        const courseObj = courses.find(c => c.course_id === subject.course_id);
        // Check if active property exists, default to true if not
        const isActive = subject.hasOwnProperty('active') ? subject.active : true;
        
        return {
          ...subject,
          course_name: courseObj ? courseObj.course_name : "Unknown Course",
          active: isActive
        };
      });
    
    console.log("Filtered subjects with active status:", filtered);
    setFilterSubjects(filtered);
  };

  const handlePopupClose = () => {
    if (popup.type === "success") {
      // Reload the page on success
      window.location.reload();
    } else {
      // Only set popup to inactive if not success
      setPopup({
        active: false,
        type: "",
        message: "",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      subject_name: "",
      course_id: "",
    });
    setCourse({ title: "", id: 0 });
    setFileData([]);
    setAdd(0);
    setEditId(null);
    setError("");
    setShowOptions(false);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      alert("File is empty");
      return;
    }
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
    const fileUrl = "/examples/subject.xlsx";
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "subject.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (add === 1 && (!formData.subject_name || course.id === 0)) {
      setError("Subject name and course are required");
      return;
    } else if (add === 2 && (course.id === 0 || fileData.length <= 0)) {
      setError("Course and file are required");
      return;
    }
    setError("");
    setLoading(true);

    try {
      let endpoint, method, body;
      if (editId) {
        endpoint = "updateASubject";
        method = "PUT";
        body = {
          subject_id: editId,
          subject_name: formData.subject_name,
          course_id: course.id
        };
      } else {
        endpoint = add === 1 ? "addASubject" : "bulkAAddSubjects";
        method = "POST";
        body = add === 1 ? { 
          subject_name: formData.subject_name,
          course_id: course.id 
        } : { 
          fileData,
          course_id: course.id 
        };
      }

      const response = await fetch(`${backend_url}/${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (response.ok) {
        // Success - fetch fresh data immediately
        await fetchData();
        
        // Then perform a search to update filtered subjects if we're in search mode
        if (search && course.id !== 0) {
          const filtered = subjects
            .filter((s) => s.course_id === course.id)
            .map(subject => {
              const courseObj = courses.find(c => c.course_id === subject.course_id);
              const isActive = subject.hasOwnProperty('active') ? subject.active : true;
              
              return {
                ...subject,
                course_name: courseObj ? courseObj.course_name : "Unknown Course",
                active: isActive
              };
            });
          
          setFilterSubjects(filtered);
        }
        
        setPopup({
          active: true,
          type: "success",
          message: editId ? "Subject updated successfully" : 
                  (add === 1 ? "Subject" : "Subjects") + " added successfully.",
        });
      } else {
        setPopup({
          active: true,
          type: "error",
          message: result.error || (editId ? "Subject update failed" :
                  (add === 1 ? "Subject" : "Subjects") + " adding failed."),
        });
      }
    } catch (error) {
      setPopup({
        active: true,
        type: "error",
        message: editId ? "Subject update failed. Please try again." :
                (add === 1 ? "Subject" : "Subjects") + " adding failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (subject) => {
    setLoading(true);
    try {
      // Before toggling - debugging
      console.log("BEFORE - Subject to toggle:", subject);
      console.log("BEFORE - Active status:", subject.active);
      console.log("BEFORE - Type of active:", typeof subject.active);
      
      const newActiveState = !subject.active;
      console.log("New active state will be:", newActiveState);
      
      const response = await fetch(`${backend_url}/updateASubject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          subject_id: subject.subject_id,
          active: newActiveState
        }),
      });

      const result = await response.json();
      console.log("Response from server:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to update subject status");
      }

      // Fetch fresh data to ensure everything is up to date
      await fetchData();
      
      // If we're in search mode, update the filtered subjects as well
      if (search && course.id !== 0) {
        const filtered = subjects
          .filter((s) => s.course_id === course.id)
          .map(subject => {
            const courseObj = courses.find(c => c.course_id === subject.course_id);
            const isActive = subject.hasOwnProperty('active') ? subject.active : true;
            
            return {
              ...subject,
              course_name: courseObj ? courseObj.course_name : "Unknown Course",
              active: isActive
            };
          });
        
        setFilterSubjects(filtered);
      }

      setPopup({
        active: true,
        type: "success",
        message: `Subject ${subject.active ? "deactivated" : "activated"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling subject status:", error);
      setPopup({
        active: true,
        type: "error",
        message: "Failed to update subject status: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (subject) => {
    setFormData({
      subject_name: subject.subject_name,
    });
    setEditId(subject.subject_id);
    
    // Find the corresponding course name
    const courseName = getCourseNameById(subject.course_id);
    
    setCourse({
      title: courseName,
      id: subject.course_id
    });
    setAdd(1);
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to show creator/updater details
  const renderUserInfo = (userInfo) => {
    if (!userInfo) return "N/A";
    return (
      <div className={styles.userInfo}>
        <span>{userInfo.name || userInfo.email || "Unknown"}</span>
      </div>
    );
  };

  // Find course name from course ID
  const getCourseNameById = (courseId) => {
    const courseObj = courses.find(c => c.course_id === courseId);
    return courseObj ? courseObj.course_name : "Unknown Course";
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
            setEditId(null);
          }}
          className={styles.add}
        >
          <Image src={"/icons/add.png"} width={25} height={25} alt="icon" />
          Add Subject
        </button>
        <button
          type="button"
          onClick={() => {
            setAdd(2);
          }}
          className={styles.add}
        >
          <Image src={"/icons/add.png"} width={25} height={25} alt="icon" />
          Add Bulk Subjects
        </button>
        <button
          type="button"
          onClick={downloadFile}
          className={styles.add}
        >
          <Image src={"/icons/submit.png"} width={25} height={25} alt="icon" />
          Excel Prototype
        </button>
      </div>
      
      {error !== "" && <p className={styles.error}>{error}</p>}
      
      <form
        className={styles.form}
        onSubmit={add !== 0 ? handleSubmit : handleSearch}
      >
        {/* Search form */}
        <div style={add === 0 ? {} : { width: 0, height: 0, opacity: 0 }}>
          <label>Course Name* :</label>
          <input
            type="text"
            value={course.title || ""}
            onChange={(e) => {
              const newValue = e.target.value.trim();
              if (newValue === "") {
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
              setCourse({ title: option.course_name || "", id: option.course_id || 0 });
            }}
            value={course.title || ""}
            type={"course"}
          />
        </div>
        
        {/* Add/Edit form fields */}
        <div style={add !== 0 && add !==2 ? {} : { width: 0, height: 0, opacity: 0 }}>
          <label>Subject Name* :</label>
          <input
            type="text"
            name="subject_name"
            value={formData.subject_name || ""}
            onChange={handleInputChange}
            placeholder="Enter Subject Name..."
          />
        </div>
        
        <div style={add !== 0 ? {} : { width: 0, height: 0, opacity: 0 }}>
          <label>Course* :</label>
          <input
            type="text"
            value={course.title || ""}
            onChange={(e) => {
              const newValue = e.target.value.trim();
              if (newValue === "") {
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
              setFormData(prev => ({
                ...prev,
                course_id: courses.find((course) => course.course_name === newValue)?.course_id || ""
              }));
            }}
            onFocus={() => setShowOptions(true)}
            onBlur={() => setTimeout(() => setShowOptions(false), 100)}
            placeholder="Type or Select Course Name..."
          />
          <InputList
            active={showOptions}
            options={courses}
            onSubmit={(option) => {
              setCourse({ title: option.course_name || "", id: option.course_id || 0 });
              setFormData(prev => ({
                ...prev,
                course_id: option.course_id || ""
              }));
            }}
            value={course.title || ""}
            type={"course"}
          />
        </div>
        
        {/* File upload for bulk add */}
        <div style={add === 2 ? {} : { width: 0, height: 0, opacity: 0 }}>
          <label>File:</label>
          <label htmlFor="file-upload" className={styles.file_label}>
            <Image
              src={fileData.length > 0 ? "/icons/success.png" : "/icons/upload.png"}
              width={30}
              height={30}
              alt="icon"
            />
            {fileData.length > 0 ? "Uploaded... change ?" : "Upload File"}
          </label>
          <input
            type="file"
            id="file-upload"
            accept=".xlsx"
            onChange={handleFileChange}
          />
        </div>
        
        {/* Search button */}
        <button
          className={styles.searchButton}
          style={
            add === 0
              ? { margin: "35px 0 0 5vw" }
              : { width: 0, height: 0, opacity: 0, margin: "0" }
          }
        >
          <Image src={"/icons/search.png"} width={50} height={50} alt="icon" />
          Search
        </button>
        
        {/* Submit button for add/edit */}
        <button style={add !== 0 ? {} : { width: 0, height: 0, opacity: 0 }}>
          <Image src={"/icons/submit.png"} width={25} height={25} alt="icon" />
          {editId ? "Update" : "Submit"}
        </button>
        
        {add !== 0 && <div></div>}
        
        {/* Close button for add/edit form */}
        <button
          type="button"
          onClick={() => {
            resetForm();
          }}
          style={
            add !== 0
              ? {
                  background: "white",
                  border: "1px solid black",
                  color: "black",
                }
              : { width: 0, height: 0, opacity: 0 }
          }
        >
          <Image src={"/icons/back.png"} width={25} height={25} alt="icon" />
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
                  "Subject ID",
                  "Subject Name",
                  "Course Name", 
                  "Created At",
                  "Created By", 
                  "Updated At",
                  "Updated By",
                  "Actions"
                ].map((heading) => (
                  <th key={heading} className={styles.tableCell}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filterSubjects.length > 0 ? (
                filterSubjects.map((subject, index) => (
                  <tr key={subject.subject_id}>
                    <td className={styles.tableCell}>{index + 1}</td>
                    <td className={styles.tableCell}>{subject.subject_id}</td>
                    <td className={styles.tableCell}>{subject.subject_name}</td>
                    <td className={styles.tableCell}>{getCourseNameById(subject.course_id)}</td>
                    <td className={styles.tableCell}>{formatDate(subject.created_at)}</td>
                    <td className={styles.tableCell}>{renderUserInfo(subject.created_by)}</td>
                    <td className={styles.tableCell}>{formatDate(subject.updated_at)}</td>
                    <td className={styles.tableCell}>{renderUserInfo(subject.updated_by)}</td>
                    <td className={styles.tableCell}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleEditClick(subject)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(subject)}
                          className={subject.active ? styles.inactiveButton : styles.activeButton}
                        >
                          {subject.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className={`${styles.tableCell} ${styles.nofound}`}>
                    <p>No Subjects Found!</p>
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