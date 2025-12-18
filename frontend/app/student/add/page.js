"use client";
import React, { useState, useEffect, Suspense } from "react";
import styles from "./add.module.css";
import Navbar from "@/components/navbar/page";
import InputList from "@/components/InputList/page";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";

function DashboardContent() {
  const [token, setToken] = useState("");
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [student, setStudent] = useState([]);
  const handleSubmit = (data) => {
    setStudent(data);
    setToken(data.token);
  };
  const searchParams = useSearchParams();
  const id = searchParams.get("log");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    active: false,
    type: "",
    message: "",
  });
  const [error, setError] = useState("");

  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    async function getData() {
      const general_data = await fetch(`${backend_url}/getGeneral`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await general_data.json();
      setCourses(data.courses || []);
      setSubjects(data.subjects || []);
      setCompetencies(data.competencies || []);
      setSkills(data.skills || []);
    }
    if (token) {
      getData();
    }
  }, [student]);

  const [course, setCourse] = useState({ title: "", id: 0 });
  const [subject, setSubject] = useState({ title: "", id: 0 });
  const [competency, setCompetency] = useState({ title: "", id: 0 });
  const [skill, setSkill] = useState({ title: "", id: 0 });
  const [skillWiseWork, setSkillWiseWork] = useState(0);
  const [noOfTimeProcedure, setNoOfTimeProcedure] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [nameOfActivity, setNameOfActivity] = useState("");
  const [linkToPortfolio, setLinkToPortfolio] = useState(null);
  const [feedbackReceived, setFeedbackReceived] = useState(0);
  const [studentReflection, setStudentReflection] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
  
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== "application/pdf") {
        setPopup({
          active: true,
          type: "error",
          message: "Only PDF files are allowed",
        });
        setLinkToPortfolio(null);
        return;
      }
  
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setPopup({
          active: true,
          type: "error",
          message: "PDF file size should not exceed 5MB",
        });
        setLinkToPortfolio(null);
        return;
      }
  
      // Valid file
      setLinkToPortfolio(selectedFile);
    }
  };
  

  const [showOptions, setShowOptions] = useState(false);
  const [showOptions2, setShowOptions2] = useState(false);
  const [showOptions3, setShowOptions3] = useState(false);
  const [showOptions4, setShowOptions4] = useState(false);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
  
    // Validate required fields
    if (
      course.id == 0 ||
      subject.id == 0 ||
      skill.id == 0 ||
      fromDate === "" ||
      toDate === ""
    ) {
      setError("Fill all mandatory fields");
      return;
    }
  
    setError("");
    setLoading(true);
    let fileUrl = "";
  
    // Handle file upload if file is selected
    if (linkToPortfolio instanceof File) {
      try {
        const formData = new FormData();
        formData.append("file", linkToPortfolio);
  
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData, // ⛔ DO NOT set content-type manually
        });
  
        const data = await response.json();
  
        if (response.ok) {
          fileUrl = data.url;
          console.log("File uploaded to:", fileUrl);
        } else {
          setPopup({
            active: true,
            type: "error",
            message: data.error || "File upload failed.",
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Upload error:", error);
        setPopup({
          active: true,
          type: "error",
          message: "Upload failed. Please try again.",
        });
        setLoading(false);
        return;
      }
    }
  
    // Prepare log body
    const body = {
      course_id: course.id,
      subject_id: subject.id,
      competency_id: competency.id,
      skill_id: skill.id,
      skillWiseWork: skillWiseWork === 0 ? 1 : skillWiseWork,
      fromDate,
      toDate,
      nameOfActivity,
      noOfTimeProcedure,
      fileUrl,
      feedbackReceived,
      studentReflection,
    };
  
    // Send log to backend
    try {
      const endpoint = id ? `${backend_url}/updateLog` : `${backend_url}/addLog`;
  
      if (id) body.log_id = id;
  
      const logResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
  
      const data = await logResponse.json();
  
      if (logResponse.ok) {
        setPopup({
          active: true,
          type: "success",
          message: id ? "Log updated successfully." : "Log added successfully.",
        });
      } else {
        setPopup({
          active: true,
          type: "error",
          message: data.error || "Log adding failed.",
        });
      }
    } catch (error) {
      console.error("Log error:", error);
      setPopup({
        active: true,
        type: "error",
        message: "Log adding failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  

  const handlePopupClose = () => {
    if (popup.type == "success") {
      router.push(`/student/home`);
    } else {
      setPopup({
        active: false,
        type: "",
        message: "",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (token && id) {
        setLoading(true);
        try {
          const response = await fetch(`${backend_url}/getLog`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error("Data not found");
          }
          setCourse({
            title:
              courses.find((course) => course.course_id == data.log.course_id)
                ?.course_name || "",
            id: data.log.course_id,
          });
          setSubject({
            title:
              subjects.find(
                (subject) => subject.subject_id == data.log.subject_id
              )?.subject_name || "",
            id: data.log.subject_id,
          });
          setCompetency({
            title:
              competencies.find(
                (competency) =>
                  competency.competency_id == data.log.competency_id
              )?.competency_name || "",
            id: data.log.competency_id,
          });
          setSkill({
            title:
              skills.find((skill) => skill.skill_id == data.log.skill_id)
                ?.skill_name || "",
            id: data.log.skill_id,
          });
          setSkillWiseWork(data.log.skillWiseWork);
          setNameOfActivity(data.log.noOfProcedure);
          setFromDate(data.log.fromDate);
          setToDate(data.log.toDate);
          setNameOfActivity(data.log.nameOfActivity);
          setFeedbackReceived(data.log.feedbackRecivied ? 1 : 2);
          setStudentReflection(data.log.student_remark);
        } catch (error) {
          setPopup({
            active: true,
            type: "error",
            message: error.message || "Server Problem",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData(); // ✅ Call the function
  }, [id, token, courses, subjects, competencies, skills]);

  return (
    <div className={styles.main}>
      <Navbar onSubmit={handleSubmit} />
      <Loading active={loading} />
      <Popup
        active={popup.active}
        type={popup.type}
        message={popup.message}
        onClose={handlePopupClose}
      />
      <h2>
        <Image src={`/icons/log.png`} width={50} height={50} alt="log_icon" />
        Add Log
      </h2>
      {error != "" && <p className={styles.error}>{error}</p>}
      <form className={styles.form} onSubmit={handleLogSubmit}>
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
          <label>Competency (Module)*:</label>
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
                  ? competencies.find(
                      (competency) => competency.competency_name === newValue
                    ).competency_id
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
            onSubmit={(competency) => {
              setCompetency({
                title: competency.competency_name,
                id: competency.competency_id,
              });
            }}
            value={competency.title}
            type={"competency"}
          />
        </div>
        <div>
          <label>Skill* :</label>
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
                  ? skills.find((skill) => skill.skill_name === newValue)
                      .skillt_id
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
              subject.id != 0
                ? competency.id != 0
                  ? skills.filter(
                      (skill) => skill.competency_id == competency.id
                    )
                  : []
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
          <label>Skill Wise Work:</label>
          <select
            value={skillWiseWork}
            onChange={(e) => {
              setSkillWiseWork(e.target.value);
            }}
          >
            <option value={0} disabled>
              Select Skill Wise Work
            </option>
            <option value={1}>Observed / Attended</option>
            <option value={2}>Assisted</option>
            <option value={3}>Done Under Supervision</option>
            <option value={4}>Able to do Indepedently / Presented</option>
          </select>
        </div>
        <div>
          <label>No Of Time Procedure:</label>
          <input
            type="number"
            value={noOfTimeProcedure}
            onChange={(e) => {
              setNoOfTimeProcedure(e.target.value);
            }}
            placeholder="Enter the No of time Procedure..."
          />
        </div>
        <div>
          <label>From Date* :</label>
          <input
            type="date"
            max={today}
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
            }}
          />
        </div>
        <div>
          <label>To Date* :</label>
          <input
            type="date"
            min={fromDate}
            max={today}
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
            }}
          />
        </div>
        <div>
          <label>Name of Activity (Topic):</label>
          <input
            type="text"
            value={nameOfActivity}
            onChange={(e) => {
              setNameOfActivity(e.target.value);
            }}
            placeholder="Enter the Name of Activity..."
          />
        </div>
        <div>
          <label>Link To Portfolio:</label>
          <label htmlFor="file-upload" className={styles.file_label}>
            <Image
              src={
                !linkToPortfolio ? `/icons/upload.png` : `/icons/success.png`
              }
              width={30}
              height={30}
              alt="icon"
            />
            {linkToPortfolio ? "Uploaded... change ?" : "Upload PDF"}
          </label>
          <input
            type="file"
            id="file-upload"
            accept="application/pdf"
            onChange={handleFileChange}
          />
        </div>
        <div>
          <label>Feedback Received:</label>
          <select
            value={feedbackReceived}
            onChange={(e) => {
              setFeedbackReceived(e.target.value);
            }}
          >
            <option value={0} disabled>
              Select Feedback
            </option>
            <option value={1}>Yes</option>
            <option value={2}>No</option>
          </select>
        </div>
        <div>
          <label>Student reflection (Remark):</label>
          <input
            type="text"
            value={studentReflection}
            onChange={(e) => {
              setStudentReflection(e.target.value);
            }}
            placeholder="Enter Remark..."
          />
        </div>
        <button className={styles.searchButton}>
          <Image src={`/icons/submit.png`} width={50} height={50} alt="icon" />
          Submit
        </button>
        <div></div>
        <button
          type="button"
          onClick={() => {
            router.push("/student/home");
          }}
          style={{
            background: "white",
            border: "1px solid black",
            color: "black",
          }}
        >
          <Image src={`/icons/back.png`} width={50} height={50} alt="icon" />
          Back to Home
        </button>
      </form>
    </div>
  );
}
export default function Dashboard() {
  return (
    <Suspense fallback={<Loading active={true} />}>
      <DashboardContent />
    </Suspense>
  );
}
