"use client";
import React, { useState, useEffect } from "react";
import styles from "./managestudents.module.css";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import Image from "next/image";
import * as XLSX from "xlsx";

export default function ManageStudents({ token, data }) {
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    active: false,
    type: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(""); // "single", "bulk", or "edit"
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    enrollNo: "",
    batchName: "",
  });
  const [editId, setEditId] = useState(null);
  const [fileData, setFileData] = useState([]);
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (data && data.students) {
      setStudents(data.students);
    }
  }, [data]);

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
      email: "",
      phone: "",
      password: "",
      enrollNo: "",
      batchName: "",
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
    const fileUrl = "/examples/students.xlsx";
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "students.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formType === "single" && (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.enrollNo || !formData.batchName)) {
      setError("fill all mandatory fields");
      return;
    } else if (formType === "bulk" && fileData.length <= 0) {
      setError("fill all mandatory fields");
      return;
    }
    setError("");
    setLoading(true);

    try {
      let endpoint, method, body;
      if (formType === "edit") {
        endpoint = "updateAStudent";
        method = "PUT";
        body = {
          id: editId,
          ...formData
        };
      } else {
        endpoint = formType === "single" ? "addAStudent" : "bulkAAddStudents";
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
       let message = "";

       if (formType === "edit") {
         message = "✅ Student updated successfully.";
       } else if (formType === "single") {
         message = "✅ Student added successfully.";
       } else {
         const failedReasons = result.results.failed
           .map((e, i) => `${i + 1}. ${e.reason}`)
           .join("\n");

         message = `✅ Students added successfully.\n\n❌ Failed Entries:\n${failedReasons}`;
       }

       setPopup({
         active: true,
         type: "success",
         message,
       });
     } else {
       setPopup({
         active: true,
         type: "error",
         message:
           result.error ||
           (formType === "edit"
             ? "Student update failed"
             : (formType === "single" ? "Student" : "Students") +
               " adding failed."),
       });
     }
    } catch (error) {
      setPopup({
        active: true,
        type: "error",
        message: formType === "edit" ? "Student update failed. Please try again." :
                (formType === "single" ? "Student" : "Students") + " adding failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${backend_url}/deleteAStudent`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      setPopup({
        active: true,
        type: "success",
        message: "Student deleted successfully",
      });
      if (data && data.students) {
        setStudents(data.students);
      }
    } catch (error) {
      setPopup({
        active: true,
        type: "error",
        message: "Failed to delete student",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (student) => {
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      password: "", // Password is not shown in edit mode
      enrollNo: student.enrollNo,
      batchName: student.batchName,
    });
    setEditId(student._id);
    setFormType("edit");
    setShowForm(true);
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
          Add Student
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
          Add Bulk Students
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
      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          {(formType === "single" || formType === "edit") && (
            <>
              <div>
                <label>Name* :</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter Student Name..."
                />
              </div>
              <div>
                <label>Email* :</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter Student Email..."
                />
              </div>
              <div>
                <label>Phone* :</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter Student Phone..."
                />
              </div>
              <div>
                <label>Enrollment No* :</label>
                <input
                  type="text"
                  name="enrollNo"
                  value={formData.enrollNo}
                  onChange={handleInputChange}
                  placeholder="Enter Enrollment Number..."
                />
              </div>
              <div>
                <label>Batch Name* :</label>
                <input
                  type="text"
                  name="batchName"
                  value={formData.batchName}
                  onChange={handleInputChange}
                  placeholder="Enter Batch Name..."
                />
              </div>
              <div>
                <label>{formType === "edit" ? "New Password (leave blank to keep current)" : "Password*"} :</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={formType === "edit" ? "Enter new password or leave blank..." : "Enter Student Password..."}
                />
              </div>
            </>
          )}
          {formType === "bulk" && (
            <div>
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
          )}
          <button type="submit">
            <Image src={"/icons/submit.png"} width={50} height={50} alt="icon" />
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
              {["No", "Name", "Email", "Phone", "Enroll No", "Batch Name", "Actions"].map((heading) => (
                <th key={heading} className={styles.tableCell}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student, index) => (
                <tr key={student._id}>
                  <td className={styles.tableCell}>{index + 1}</td>
                  <td className={styles.tableCell}>{student.name}</td>
                  <td className={styles.tableCell}>{student.email}</td>
                  <td className={styles.tableCell}>{student.phone}</td>
                  <td className={styles.tableCell}>{student.enrollNo}</td>
                  <td className={styles.tableCell}>{student.batchName}</td>
                  <td className={styles.tableCell}>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleEditClick(student)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student._id)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className={`${styles.tableCell} ${styles.nofound}`}>
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
