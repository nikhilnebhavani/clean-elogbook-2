"use client";
import React, { useState, useEffect } from "react";
import styles from "./manageCourses.module.css";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import Image from "next/image";
import * as XLSX from "xlsx";

export default function ManageCourses({ token, data }) {
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    active: false,
    type: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(""); // "single", "bulk", or "edit"
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [editId, setEditId] = useState(null);
  const [fileData, setFileData] = useState([]);
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Add a fetchData function to get fresh data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backend_url}/getAGeneral`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.courses) {
        setCourses(result.courses);
        console.log("Courses refreshed:", result.courses.length);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data && data.courses) {
      setCourses(data.courses);
    }
  }, [data]);

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
      name: "",
    });
    setFileData([]);
    setShowForm(false);
    setFormType("");
    setEditId(null);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      alert("file is empty");
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
    const fileUrl = "/examples/course.xlsx";
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "course.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formType === "single" && !formData.name) {
      setError("Course name is required");
      return;
    } else if (formType === "bulk" && fileData.length <= 0) {
      setError("Please upload a file");
      return;
    }
    setError("");
    setLoading(true);

    try {
      let endpoint, method, body;
      if (formType === "edit") {
        endpoint = "updateACourse";
        method = "PUT";
        body = {
          id: editId,
          name: formData.name
        };
      } else {
        endpoint = formType === "single" ? "addACourse" : "bulkAAddCourses";
        method = "POST";
        body = formType === "single" ? formData : { fileData };
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
        // Success - first update the UI immediately
        fetchData();
        
        setPopup({
          active: true,
          type: "success",
          message: formType === "edit" ? "Course updated successfully" : 
                  (formType === "single" ? "Course" : "Courses") + " added successfully.",
        });
      } else {
        setPopup({
          active: true,
          type: "error",
          message: result.error || (formType === "edit" ? "Course update failed" :
                  (formType === "single" ? "Course" : "Courses") + " adding failed."),
        });
      }
    } catch (error) {
      setPopup({
        active: true,
        type: "error",
        message: formType === "edit" ? "Course update failed. Please try again." :
                (formType === "single" ? "Course" : "Courses") + " adding failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (course) => {
    setLoading(true);
    try {
      console.log("BEFORE - Course to toggle:", course);
      console.log("BEFORE - Active status:", course.active);
      console.log("BEFORE - Type of active:", typeof course.active);
      
      const newActiveState = !course.active;
      console.log("New active state will be:", newActiveState);
      
      const response = await fetch(`${backend_url}/updateACourse`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          id: course.course_id,
          active: newActiveState
        }),
      });

      const result = await response.json();
      console.log("Response from server:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to update course status");
      }

      // Fetch fresh data immediately instead of just updating local state
      await fetchData();

      setPopup({
        active: true,
        type: "success",
        message: `Course ${course.active ? "deactivated" : "activated"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling course status:", error);
      setPopup({
        active: true,
        type: "error",
        message: "Failed to update course status: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (course) => {
    setFormData({
      name: course.course_name,
    });
    setEditId(course.course_id);
    setFormType("edit");
    setShowForm(true);
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
            setFormType("single");
            setShowForm(true);
          }}
          className={styles.add}
        >
          <Image src={"/icons/add.png"} width={25} height={25} alt="icon" />
          Add Course
        </button>
        <button
          type="button"
          onClick={() => {
            setFormType("bulk");
            setShowForm(true);
          }}
          className={styles.add}
        >
          <Image src={"/icons/add.png"} width={25} height={25} alt="icon" />
          Add Bulk Courses
        </button>
        <button type="button" onClick={downloadFile} className={styles.add}>
          <Image src={"/icons/submit.png"} width={25} height={25} alt="icon" />
          Excel Prototype
        </button>
      </div>
      {error !== "" && <p className={styles.error}>{error}</p>}
      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          {(formType === "single" || formType === "edit") && (
            <div className={styles.fullWidth}>
              <label>Course Name* :</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter Course Name..."
              />
            </div>
          )}
          {formType === "bulk" && (
            <div>
              <label>File:</label>
              <label htmlFor="file-upload" className={styles.file_label}>
                <Image
                  src={
                    fileData.length > 0
                      ? "/icons/success.png"
                      : "/icons/upload.png"
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
                accept=".xlsx"
                onChange={handleFileChange}
              />
            </div>
          )}
          <button type="submit">
            <Image
              src={"/icons/submit.png"}
              width={50}
              height={50}
              alt="icon"
            />
            {formType === "edit" ? "Update" : "Submit"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            style={{
              background: "white",
              border: "1px solid black",
              color: "black",
            }}
          >
            <Image src={"/icons/back.png"} width={30} height={30} alt="icon" />
            Close
          </button>
        </form>
      )}

      <section className={styles.tableSection}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              {[
                "No",
                "Course ID",
                "Course Name",
                "Created At",
                "Created By",
                "Updated At",
                "Updated By",
                "Status",
                "Action",
              ].map((heading) => (
                <th key={heading} className={styles.tableCell}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.length > 0 ? (
              courses.map((course, index) => (
                <tr key={course.course_id}>
                  <td className={styles.tableCell}>{index + 1}</td>
                  <td className={styles.tableCell}>{course.course_id}</td>
                  <td className={styles.tableCell}>{course.course_name}</td>
                  <td className={styles.tableCell}>
                    {formatDate(course.created_at)}
                  </td>
                  <td className={styles.tableCell}>
                    {renderUserInfo(course.created_by)}
                  </td>
                  <td className={styles.tableCell}>
                    {formatDate(course.updated_at)}
                  </td>
                  <td className={styles.tableCell}>
                    {renderUserInfo(course.updated_by)}
                  </td>
                  <td className={styles.tableCell}>
                    <button
                      onClick={() => toggleActive(course)}
                      className={`${styles.statusButton} ${
                        !course.active
                          ? styles.inactiveButton
                          : styles.activeButton
                      }`}
                    ></button>
                  </td>
                  <td className={styles.tableCell}>
                    <button
                      onClick={() => handleEditClick(course)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
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