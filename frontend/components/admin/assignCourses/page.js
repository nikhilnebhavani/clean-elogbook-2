"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./assignCourses.module.css";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import Image from "next/image";
import InputList from "@/components/InputList/page";

export default function AssignCourses({ token }) {
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
  const [courses, setCourses] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // For input dropdowns
  const [selectedStudent, setSelectedStudent] = useState({ title: "", id: "" });
  const [selectedCourse, setSelectedCourse] = useState({ title: "", id: "" });
  const [showTable, setShowTable] = useState(false);

  // For showing dropdown lists
  const [showStudentOptions, setShowStudentOptions] = useState(false);
  const [showCourseOptions, setShowCourseOptions] = useState(false);

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
        console.log(
          "Student data sample:",
          data.students && data.students.length > 0
            ? data.students[0]
            : "No students"
        );

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

        console.log("Processed students:", processedStudents);

        setStudents(processedStudents);
        setCourses(data.courses || []);
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
    if (!selectedCourse.id) {
      setError("Please select a course");
      return;
    }

    setError("");
    setLoading(true);

    try {
      console.log(
        "Searching for students with course:",
        selectedCourse.id
      );

      // Filter students with the selected course
      const filteredStudents = students.filter((student) => {
        // Get the assignments with the right property name
        const courses = student.courses || [];

        if (courses.length === 0) return false;

        return courses.some(
          (courseItem) => courseItem.course === selectedCourse.id
        );
      });

      console.log("Filtered students:", filteredStudents);

      if (filteredStudents.length === 0) {
        console.log("No students found with the selected course.");
      }

      setSearchResults(filteredStudents);
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
    if (!selectedStudent.id || !selectedCourse.id) {
      setError("Please select both student and course");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const body = {
        studentId: ensureValidId(selectedStudent.id),
        course: selectedCourse.id
      };

      console.log("Sending data to server:", body);

      const response = await fetch(`${backend_url}/assignACourses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      // Wrap JSON parsing in try/catch to handle potential parsing errors
      let data;
      try {
        data = await response.json();
        console.log("Server response:", data);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        // Token decryption or JSON parsing error occurred
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
          message: data.message || "Course assigned successfully",
        });

        // Reset form and close it
        setSelectedStudent({ title: "", id: "" });
        setSelectedCourse({ title: "", id: "" });
        setShowAssignForm(false);

        // Refresh student data
        refreshStudentData();
      } else {
        // Create a safe error message
        const errorMessage =
          data && typeof data.error === "string"
            ? data.error
            : "Failed to assign course. Please try again.";

        setPopup({
          active: true,
          type: "error",
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error("Error in form submission:", error);

      // Safely create error message without accessing potentially undefined properties
      const errorMessage =
        error instanceof Error
          ? `Failed to assign course: ${error.message}`
          : "Failed to assign course. Please try again.";

      setPopup({
        active: true,
        type: "error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a function to refresh student data
  const refreshStudentData = async () => {
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
      setSelectedStudent({ title: "", id: "" });
      setSelectedCourse({ title: "", id: "" });
      setError("");
    }
  };

  const handleDeleteAssignment = async (studentId, course) => {
    setLoading(true);
    try {
      const response = await fetch(`${backend_url}/assignACourses/${ensureValidId(studentId)}`, {
        method: 'DELETE',
          headers: {
          'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        body: JSON.stringify({ course }),
      });

      const data = await response.json();

      if (response.ok) {
        setPopup({
          active: true,
          type: 'success',
          message: data.message || 'Course assignment removed successfully',
        });

        // Refresh the search results
        if (selectedCourse.id) {
          handleSearch();
        } else {
          refreshStudentData();
        }
      } else {
        setPopup({
          active: true,
          type: 'error',
          message: data.error || 'Failed to remove course assignment',
        });
      }
    } catch (error) {
      console.error('Error removing course assignment:', error);
      setPopup({
        active: true,
        type: 'error',
        message: 'An error occurred while removing the course assignment',
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
            <label>Student Name* :</label>
            <input
              type="text"
              value={selectedStudent.title}
              onChange={(e) => {
                const newValue = e.target.value;
                setSelectedStudent({
                  title: newValue,
                  id: "",
                });
              }}
              onFocus={() => setShowStudentOptions(true)}
              onBlur={() => setTimeout(() => setShowStudentOptions(false), 100)}
              placeholder="Type or Select Student Name..."
            />
            <InputList
              active={showStudentOptions}
              options={students}
              onSubmit={(student) => {
                console.log("Selected student:", student);
                const studentName = student.name || student.student_name;
                setSelectedStudent({
                  title: studentName,
                  id: student._id || student.student_id,
                });
              }}
              value={selectedStudent.title}
              type={"student"}
            />
          </div>

          <div>
            <label>Course Name* :</label>
            <input
              type="text"
              value={selectedCourse.title}
              onChange={(e) => {
                const newValue = e.target.value;
                setSelectedCourse({
                  title: newValue,
                  id: "",
                });
              }}
              onFocus={() => setShowCourseOptions(true)}
              onBlur={() => setTimeout(() => setShowCourseOptions(false), 100)}
              placeholder="Type or Select Course Name..."
            />
            <InputList
              active={showCourseOptions}
              options={courses}
              onSubmit={(course) => {
                console.log("Selected course:", course);
                setSelectedCourse({
                  title: course.course_name,
                  id: course.course_id,
                });
              }}
              value={selectedCourse.title}
              type={"course"}
            />
          </div>

          <button
            type="button"
            onClick={handleAssignSubmit}
            className={styles.submitButton}
          >
            <Image src="/icons/submit.png" width={25} height={25} alt="icon" />
            Assign Course
          </button>
        </div>
      ) : (
        <>
          <form className={styles.form}>
            <div>
              <label>Course Name* :</label>
              <input
                type="text"
                value={selectedCourse.title}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSelectedCourse({
                    title: newValue,
                    id: "",
                  });
                  setShowTable(false);
                }}
                onFocus={() => setShowCourseOptions(true)}
                onBlur={() =>
                  setTimeout(() => setShowCourseOptions(false), 100)
                }
                placeholder="Type or Select Course Name..."
              />
              <InputList
                active={showCourseOptions}
                options={courses}
                onSubmit={(course) => {
                  console.log("Selected course:", course);
                  setSelectedCourse({
                    title: course.course_name,
                    id: course.course_id,
                  });
                  setShowTable(false);
                }}
                value={selectedCourse.title}
                type={"course"}
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
                      <th className={styles.tableCell}>Assigned Course</th>
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
                            {selectedCourse.title}
                            <button
                              onClick={() => handleDeleteAssignment(student._id, selectedCourse.id)}
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
