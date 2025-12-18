"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./assignSubjects.module.css";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import Image from "next/image";
import InputList from "@/components/InputList/page";

export default function AssignSubjects({token}) {
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
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  
  // For input dropdowns
  const [selectedTeacher, setSelectedTeacher] = useState({ title: "", id: "" });
  const [selectedCourse, setSelectedCourse] = useState({ title: "", id: "" });
  const [selectedSubject, setSelectedSubject] = useState({ title: "", id: "" });
  const [showTable, setShowTable] = useState(false);
  
  // For showing dropdown lists
  const [showTeacherOptions, setShowTeacherOptions] = useState(false);
  const [showCourseOptions, setShowCourseOptions] = useState(false);
  const [showSubjectOptions, setShowSubjectOptions] = useState(false);

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
        console.log("Teachers:", data.teachers);
        console.log("Teacher data sample:", data.teachers && data.teachers.length > 0 ? data.teachers[0] : "No teachers");
        
        // Fix the teacher data structure if needed
        const processedTeachers = (data.teachers || []).map(teacher => {
          // Ensure teacher has consistent properties
          return {
            ...teacher,
            name: teacher.name || teacher.teacher_name || "Unknown Teacher",
            email: teacher.email || teacher.teacher_email || "N/A",
            _id: teacher._id || teacher.teacher_id || `temp-${Math.random()}`
          };
        });
        
        console.log("Processed teachers:", processedTeachers);
        
        setTeachers(processedTeachers);
        setCourses(data.courses || []);
        setSubjects(data.subjects || []);
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

  // Filter subjects based on selected course
  useEffect(() => {
    if (selectedCourse.id) {
      const filtered = subjects.filter(
        (subject) => subject.course_id === selectedCourse.id
      );
      console.log("Filtered subjects for course", selectedCourse.id, ":", filtered);
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects([]);
    }
  }, [selectedCourse.id, subjects]);

  const handleSearch = () => {
    if (!selectedCourse.id || !selectedSubject.id) {
      setError("Please select both course and subject");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      console.log("Searching for teachers with course:", selectedCourse.id, "and subject:", selectedSubject.id);
      
      // Filter teachers with the selected course and subject
      const filteredTeachers = teachers.filter(teacher => {
        // Get the assignments with the right property name
        const assignments = teacher.courses || [];
        
        if (assignments.length === 0) return false;
        
        return assignments.some(assignment => {
          const courseMatch = assignment.course === selectedCourse.id;
          const subjectMatch = assignment.subjects.includes(selectedSubject.id);
          
          return courseMatch && subjectMatch;
        });
      });
      
      console.log("Filtered teachers:", filteredTeachers);
      
      if (filteredTeachers.length === 0) {
        console.log("No teachers found with the selected course and subject.");
      }
      
      setSearchResults(filteredTeachers);
      setShowTable(true);
      setLoading(false);
    } catch (error) {
      console.error("Error searching teachers:", error);
      setError("Failed to search teachers");
      setLoading(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedTeacher.id || !selectedCourse.id || !selectedSubject.id) {
      setError("Please select teacher, course, and subject");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      const body = {
        teacherId: selectedTeacher.id,
        course: selectedCourse.id,
        subject: selectedSubject.id
      };

      console.log("Sending data to server:", body);

      const response = await fetch(`${backend_url}/assignASubjects`, {
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
          message: "Subject assigned successfully",
        });
        
        // Reset form and close it
        setSelectedTeacher({ title: "", id: "" });
        setSelectedCourse({ title: "", id: "" });
        setSelectedSubject({ title: "", id: "" });
        setShowAssignForm(false);
        
        // Refresh teacher data
        refreshTeacherData();
      } else {
        // Create a safe error message
        const errorMessage = data && typeof data.error === 'string' 
          ? data.error 
          : "Failed to assign subject. Please try again.";
        
        setPopup({
          active: true,
          type: "error",
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      
      // Safely create error message without accessing potentially undefined properties
      const errorMessage = error instanceof Error 
        ? `Failed to assign subject: ${error.message}` 
        : "Failed to assign subject. Please try again.";
      
      setPopup({
        active: true,
        type: "error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a function to refresh teacher data
  const refreshTeacherData = async () => {
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
      setSelectedTeacher({ title: "", id: "" });
      setSelectedCourse({ title: "", id: "" });
      setSelectedSubject({ title: "", id: "" });
      setError("");
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
        <button type="button" onClick={toggleAssignForm} className={styles.addButton}>
          <Image src={showAssignForm ? "/icons/back.png" : "/icons/add.png"} width={25} height={25} alt="icon" />
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
                  id: teacher._id || teacher.teacher_id
                });
              }}
              value={selectedTeacher.title}
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
                setSelectedSubject({ title: "", id: "" });
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
                  id: course.course_id 
                });
                setSelectedSubject({ title: "", id: "" });
              }}
              value={selectedCourse.title}
              type={"course"}
            />
          </div>
          
          <div>
            <label>Subject Name* :</label>
            <input
              type="text"
              value={selectedSubject.title}
              onChange={(e) => {
                const newValue = e.target.value;
                setSelectedSubject({
                  title: newValue,
                  id: "",
                });
              }}
              onFocus={() => {
                if (selectedCourse.id) {
                  setShowSubjectOptions(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowSubjectOptions(false), 100)}
              placeholder={selectedCourse.id ? "Type or Select Subject Name..." : "Select a course first"}
              disabled={!selectedCourse.id}
            />
            <InputList
              active={showSubjectOptions && selectedCourse.id !== ""}
              options={filteredSubjects}
              onSubmit={(subject) => {
                console.log("Selected subject:", subject);
                setSelectedSubject({ 
                  title: subject.subject_name, 
                  id: subject.subject_id 
                });
              }}
              value={selectedSubject.title}
              type={"subject"}
            />
          </div>
          
          <button type="button" onClick={handleAssignSubmit} className={styles.submitButton}>
            <Image src="/icons/submit.png" width={25} height={25} alt="icon" />
            Assign Subject
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
                  setSelectedSubject({ title: "", id: "" });
                  setShowTable(false);
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
                    id: course.course_id 
                  });
                  setSelectedSubject({ title: "", id: "" });
                  setShowTable(false);
                }}
                value={selectedCourse.title}
                type={"course"}
              />
            </div>
            
            <div>
              <label>Subject Name* :</label>
              <input
                type="text"
                value={selectedSubject.title}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSelectedSubject({
                    title: newValue,
                    id: "",
                  });
                  setShowTable(false);
                }}
                onFocus={() => {
                  if (selectedCourse.id) {
                    setShowSubjectOptions(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSubjectOptions(false), 100)}
                placeholder={selectedCourse.id ? "Type or Select Subject Name..." : "Select a course first"}
                disabled={!selectedCourse.id}
              />
              <InputList
                active={showSubjectOptions && selectedCourse.id !== ""}
                options={filteredSubjects}
                onSubmit={(subject) => {
                  console.log("Selected subject:", subject);
                  setSelectedSubject({ 
                    title: subject.subject_name, 
                    id: subject.subject_id 
                  });
                }}
                value={selectedSubject.title}
                type={"subject"}
              />
            </div>
            
            <button type="button" onClick={handleSearch} className={styles.searchButton}>
              <Image src="/icons/search.png" width={25} height={25} alt="search" />
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
                      <th className={styles.tableCell}>Teacher Name</th>
                      <th className={styles.tableCell}>Email</th>
                      <th className={styles.tableCell}>Assigned Subjects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((teacher, index) => {
                      // Get teacher name and email with fallbacks
                      const teacherName = teacher.name || teacher.teacher_name || "Unknown";
                      const teacherEmail = teacher.email || teacher.teacher_email || "N/A";
                      
                      return (
                        <tr key={teacher._id || teacher.teacher_id || index}>
                          <td className={styles.tableCell}>{index + 1}</td>
                          <td className={styles.tableCell}>{teacherName}</td>
                          <td className={styles.tableCell}>{teacherEmail}</td>
                          <td className={styles.tableCell}>
                            {selectedCourse.title} - {selectedSubject.title}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className={styles.nofound}>
                  <p>No Teachers Found!</p>
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