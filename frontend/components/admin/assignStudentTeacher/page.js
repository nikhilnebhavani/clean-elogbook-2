"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./assignStudentTeacher.module.css";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import Image from "next/image";
import InputList from "@/components/InputList/page";
import { saveAs } from 'file-saver';

export default function AssignStudentTeacher({ token }) {
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    active: false,
    type: "",
    message: "",
  });
  const [error, setError] = useState("");
  const tableRef = useRef(null);
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Data states
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // For input dropdowns
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState({ title: "", id: "" });
  const [showTable, setShowTable] = useState(false);

  // For showing dropdown lists
  const [showStudentOptions, setShowStudentOptions] = useState(false);
  const [showTeacherOptions, setShowTeacherOptions] = useState(false);

  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true);
        const general_data = await fetch(`${backend_url}/getAGeneral`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await general_data.json();

        // Enhanced logging to see exactly what we're getting
        console.log("Retrieved data:", data);
        console.log("Students:", data.students);
        console.log("Teachers:", data.teachers);

        // Fix the student data structure if needed
        const processedStudents = (data.students || []).map((student) => {
          // Ensure student has consistent properties and proper _id format
          return {
            ...student,
            name: student.name || student.student_name || "Unknown Student",
            email: student.email || student.student_email || "N/A",
            _id: student._id || student.student_id || `temp-${Math.random()}`,
          };
        });

        // Fix the teacher data structure if needed
        const processedTeachers = (data.teachers || []).map((teacher) => {
          // Ensure teacher has consistent properties and proper _id format
          return {
            ...teacher,
            name: teacher.name || teacher.teacher_name || "Unknown Teacher",
            email: teacher.email || teacher.teacher_email || "N/A",
            _id: teacher._id || teacher.teacher_id || `temp-${Math.random()}`,
            students: teacher.students || [],
          };
        });

        console.log("Processed students:", processedStudents);
        console.log("Processed teachers:", processedTeachers);

        setStudents(processedStudents);
        setTeachers(processedTeachers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data");
        setLoading(false);
      }
    }
    if (token) {
      getData();
    }
  }, [token, backend_url]);

  const handleSearch = () => {
    if (!selectedTeacher.id) {
      setError("Please select a teacher");
      return;
    }

    setError("");
    setLoading(true);

    try {
      console.log(
        "Searching for students assigned to teacher:",
        selectedTeacher.id
      );

      const teacher = teachers.find(t => t._id === selectedTeacher.id);
      
      if (!teacher) {
        console.log("Teacher not found");
        setSearchResults([]);
        setShowTable(true);
        setLoading(false);
        return;
      }
      
      // Get the student IDs assigned to this teacher
      const studentIds = teacher.students || [];
      
      if (studentIds.length === 0) {
        console.log("No students assigned to this teacher");
        setSearchResults([]);
        setShowTable(true);
        setLoading(false);
        return;
      }
      
      // Find all the students based on the IDs
      const assignedStudents = students.filter(student => 
        studentIds.includes(student._id)
      );

      console.log("Assigned students:", assignedStudents);

      setSearchResults(assignedStudents);
      setShowTable(true);
      setLoading(false);
    } catch (error) {
      console.error("Error searching students:", error);
      setError("Failed to search students");
      setLoading(false);
    }
  };


  // Add this function to ensure valid MongoDB ObjectId
  const ensureValidId = (id) => {
    // MongoDB ObjectId is a 24-character hex string
    if (typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
      return id;
    }

    // If it's already in the correct format, return it
    if (
      typeof id === "object" &&
      id.toString &&
      /^[0-9a-fA-F]{24}$/.test(id.toString())
    ) {
      return id.toString();
    }

    console.warn(`Invalid ID format: ${id}`);
    return id; // Return as is, let server handle validation
  };

  const handleAssignSubmit = async () => {
    if (selectedStudents.length === 0 || !selectedTeacher.id) {
      setError("Please select at least one student and a teacher");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const body = {
        teacherId: ensureValidId(selectedTeacher.id),
        studentIds: selectedStudents.map(student => ensureValidId(student.id))
      };

      console.log("Sending data to server:", body);

      const response = await fetch(`${backend_url}/assignAStudentTeacher/assignStudentTeacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      let data;
      try {
        data = await response.json();
        console.log("Server response:", data);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        setPopup({
          active: true,
          type: "error",
          message: "Failed to process server response. Token may be invalid.",
        });
        setLoading(false);
        return;
      }

      if (response.ok) {
        setPopup({
          active: true,
          type: "success",
          message: data.message || "Students assigned to teacher successfully",
        });

        // Reset form and close it
        setSelectedStudents([]);
        setSelectedTeacher({ title: "", id: "" });
        setShowAssignForm(false);

        // Refresh teacher data
        refreshData();
      } else {
        const errorMessage =
          data && typeof data.error === "string"
            ? data.error
            : "Failed to assign students to teacher. Please try again.";

        setPopup({
          active: true,
          type: "error",
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      const errorMessage =
        error instanceof Error
          ? `Failed to assign students: ${error.message}`
          : "Failed to assign students to teacher. Please try again.";

      setPopup({
        active: true,
        type: "error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a function to refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      const general_data = await fetch(`${backend_url}/getAGeneral`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await general_data.json();
      console.log("Refreshed data:", data);
      setStudents(data.students || []);
      setTeachers(data.teachers || []);
      setLoading(false);
    } catch (error) {
      console.error("Error refreshing data:", error);
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

  const toggleAssignForm = () => {
    setShowAssignForm(!showAssignForm);
    if (!showAssignForm) {
      // Reset form when opening
      setSelectedStudents([]);
      setSelectedTeacher({ title: "", id: "" });
      setError("");
    }
  };

  const handleDeleteAssignment = async (studentId, teacherId) => {
    setLoading(true);
    try {
      const response = await fetch(`${backend_url}/assignAStudentTeacher/assignStudentTeacher/${ensureValidId(teacherId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId: ensureValidId(studentId) }),
      });

      const data = await response.json();

      if (response.ok) {
        setPopup({
          active: true,
          type: 'success',
          message: data.message || 'Student removed from teacher successfully',
        });
        
        // Refresh the search results
        if (selectedTeacher.id) {
          handleSearch();
        } else {
          refreshData();
        }
      } else {
        setPopup({
          active: true,
          type: 'error',
          message: data.error || 'Failed to remove student from teacher',
        });
      }
    } catch (error) {
      console.error('Error removing student from teacher:', error);
      setPopup({
        active: true,
        type: 'error',
        message: 'An error occurred while removing the student from teacher',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backend_url}/assignAStudentTeacher/download`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      saveAs(blob, 'student_teacher_assignments.xlsx');

      setPopup({
        active: true,
        type: "success",
        message: "Template downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      setPopup({
        active: true,
        type: "error",
        message: "Failed to download template",
      });
    } finally {
      setLoading(false);
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

      <div className={styles.head}>
        <button
          type="button"
          onClick={toggleAssignForm}
          className={styles.addButton}
        >
          <Image
            src={showAssignForm ? "/icons/back.png" : "/icons/add.png"}
            width={25}
            height={25}
            alt="icon"
          />
          {showAssignForm ? "Close Form" : "Add Assign"}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showAssignForm ? (
        <div className={styles.form}>
          <div>
            <label>Teacher Name* :</label>
            <input
              type="text"
              value={selectedTeacher.title}
              onChange={(e) => {
                const newValue = e.target.value;
                setSelectedTeacher({
                  title: newValue,
                  id: "",
                });
              }}
              onFocus={() => setShowTeacherOptions(true)}
              onBlur={() => setTimeout(() => setShowTeacherOptions(false), 100)}
              placeholder="Type or Select Teacher Name..."
            />
            <InputList
              active={showTeacherOptions}
              options={teachers}
              onSubmit={(teacher) => {
                console.log("Selected teacher:", teacher);
                const teacherName = teacher.name || teacher.teacher_name;
                setSelectedTeacher({
                  title: teacherName,
                  id: teacher._id || teacher.teacher_id,
                });
                }}
                value={selectedTeacher.title}
                type={"student"}
              />
              </div>

              <div>
              <label>Select Students* :</label>
              <input
                type="text"
                value={studentSearch || ""}
                onChange={(e) => {
                const newValue = e.target.value;
                setStudentSearch(newValue);
                setShowStudentOptions(true);
                }}
                onFocus={() => setShowStudentOptions(true)}
                onBlur={() => setTimeout(() => setShowStudentOptions(false), 100)}
                placeholder="Type or Select Student Names..."
              />
              <InputList
                active={showStudentOptions}
                options={students
                .filter(student =>
                  !selectedStudents.some(selected => selected.id === (student._id || student.student_id))
                )
                .filter(student => {
                  if (!studentSearch) return true;
                  const name = (student.name || student.student_name || "").toLowerCase();
                  const email = (student.email || student.student_email || "").toLowerCase();
                  return (
                  name.includes(studentSearch.toLowerCase()) ||
                  email.includes(studentSearch.toLowerCase())
                  );
                })
                }
                onSubmit={(student) => {
                console.log("Selected student:", student);
                const studentName = student.name || student.student_name;
                const studentId = student._id || student.student_id;

                if (!selectedStudents.some(s => s.id === studentId)) {
                  setSelectedStudents([...selectedStudents, {
                  title: studentName,
                  id: studentId
                  }]);
                }
                setStudentSearch(""); // clear search after selection
                }}
                value={studentSearch || ""}
                type={"student"}
              />
              </div>

              {selectedStudents.length > 0 && (
              <div className={styles.selectedStudents}>
                <h4>Selected Students:</h4>
                <div className={styles.selectedStudentsList}>
                {selectedStudents.map((student, index) => (
                  <div key={index} className={styles.selectedStudentItem}>
                  <span>{student.title}</span>
                  <button
                    onClick={() => {
                        setSelectedStudents(selectedStudents.filter((_, i) => i !== index));
                      }}
                      className={styles.removeStudentButton}
                    >
                      <Image src="/icons/delete.png" width={15} height={15} alt="remove" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAssignSubmit}
            className={styles.submitButton}
          >
            <Image src="/icons/submit.png" width={25} height={25} alt="icon" />
            Assign Students to Teacher
          </button>
        </div>
      ) : (
        <>
          <form className={styles.form}>
            <div>
              <label>Teacher Name* :</label>
              <input
                type="text"
                value={selectedTeacher.title}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSelectedTeacher({
                    title: newValue,
                    id: "",
                  });
                  setShowTable(false);
                }}
                onFocus={() => setShowTeacherOptions(true)}
                onBlur={() =>
                  setTimeout(() => setShowTeacherOptions(false), 100)
                }
                placeholder="Type or Select Teacher Name..."
              />
              <InputList
                active={showTeacherOptions}
                options={teachers}
                onSubmit={(teacher) => {
                  console.log("Selected teacher:", teacher);
                  const teacherName = teacher.name || teacher.teacher_name;
                  setSelectedTeacher({
                    title: teacherName,
                    id: teacher._id || teacher.teacher_id,
                  });
                  setShowTable(false);
                }}
                value={selectedTeacher.title}
                type={"student"}
              />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className={styles.searchButton}
            >
              <Image
                src="/icons/search.png"
                width={25}
                height={25}
                alt="search"
              />
              Search
            </button>

            
          </form>

          {showTable && (
            <div className={styles.tableSection}>
              {searchResults.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHead}>
                      <th className={styles.tableCell}>No</th>
                      <th className={styles.tableCell}>Student Name</th>
                      <th className={styles.tableCell}>Email</th>
                      <th className={styles.tableCell}>Assigned Teacher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((student, index) => {
                      // Get student name and email with fallbacks
                      const studentName =
                        student.name || student.student_name || "Unknown";
                      const studentEmail =
                        student.email || student.student_email || "N/A";

                      return (
                        <tr key={student._id || student.student_id || index}>
                          <td className={styles.tableCell}>{index + 1}</td>
                          <td className={styles.tableCell}>{studentName}</td>
                          <td className={styles.tableCell}>{studentEmail}</td>
                          <td className={styles.tableCell}>
                            {selectedTeacher.title}
                            <button
                              onClick={() => handleDeleteAssignment(student._id, selectedTeacher.id)}
                              className={styles.deleteButton}
                              title="Remove assignment"
                            >
                              <Image src="/icons/delete.png" width={18} height={18} alt="delete" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className={styles.nofound}>
                  <p>No Students Found!</p>
                  <Image
                    src={"/gifs/no-found.gif"}
                    width={250}
                    height={250}
                    alt="gif"
                  />
                </div>
              )}
            </div>
          )}

          

          
        </>
      )}
    </div>
  );
}
