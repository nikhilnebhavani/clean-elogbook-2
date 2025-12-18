"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./oldData.module.css";
import InputList from "@/components/InputList/page";
import Image from "next/image";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import * as XLSX from "xlsx";

export default function ManageOldData({ token }) {
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;

  const attemptActivities = [
    { title: "First Or Only(f)", id: 1 },
    { title: "Repeat", id: 2 },
    { title: "Remedial", id: 3 },
    { title: "Not Applicable", id: 4 },
  ];

  const ratings = [
    { title: "Below Expectations", id: 1 },
    { title: "Meets(M) Expectations", id: 2 },
    { title: "Exceeds Expectations", id: 3 },
    { title: "Not Applicable", id: 4 },
  ];

  const decisions = [
    { title: "Completed(C)", id: 1 },
    { title: "Repeat", id: 2 },
    { title: "Remedial(Re)", id: 3 },
    { title: "Not Applicable", id: 4 },
  ];

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ active: false, type: "", message: "" });
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [skills, setSkills] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [course, setCourse] = useState({ title: "", id: 0 });
  const [subject, setSubject] = useState({ title: "", id: 0 });
  const [fileData, setFileData] = useState([]);
  const [addType, setAddType] = useState(1); // 1 = logs, 2 = skills
  const [showOptions, setShowOptions] = useState(false);
  const [showOptions2, setShowOptions2] = useState(false);

  useEffect(() => {
    async function getData() {
      const res = await fetch(`${backend_url}/getAGeneral`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setCourses(data.courses);
      setSubjects(data.subjects);
      setStudents(data.students);
      setSkills(data.skills);
      setCompetencies(data.competencies);
    }
    if (token) getData();
  }, [token]);

  const handleLogSubmit = async (e) => {
    e.preventDefault();

    if (fileData.length <= 0) {
      setError("Please upload a valid Excel file.");
      return;
    }

    if (addType === 1 && (course.id === 0 || subject.id === 0)) {
      setError("Please fill in course and subject for logs.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const body = {
        course_id: course.id,
        subject_id: subject.id,
        fileData,
        add: addType,
      };

      const res = await fetch(`${backend_url}/addAOldLogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      setPopup({
        active: true,
        type: res.ok ? "success" : "error",
        message: res.ok ? "Data added successfully." : data.error || "Failed.",
      });
    } catch (err) {
      setPopup({
        active: true,
        type: "error",
        message: "Something went wrong. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePopupClose = () => {
    if (popup.type === "success") {
      window.location.reload();
    } else {
      setPopup({ active: false, type: "", message: "" });
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith(".xlsx")) {
      alert("Please upload a valid Excel (.xlsx) file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      if (addType === 1) {
        // Logs
        const processed = jsonData.map((row) => {
          const student = students.find((s) => s.name === row["Student Name"]);
          // 1. Find the correct skill by name and subject
          const skill = skills.find(
            (s) =>
              s.skill_name === row["Skill / Competency Addresed"] &&
              s.subject_id === parseInt(subject.id)
          );

          // 2. Determine the competency
          let competency;

          if (row["Competency (Module)"]) {
            // If a name is provided, find by name
            competency = competencies.find(
              (c) =>
                c.competency_name === row["Competency (Module)"] &&
                parseInt(c.subject_id) === parseInt(subject.id)
            );
          } else if (skill) {
            // Otherwise, use subject_id + competency_id from skill
            competency = competencies.find(
              (c) =>
                c.subject_id === subject.id &&
                c.competency_id === skill.competency_id
            );
          }

          const attemptActivity =
            attemptActivities.find((a) => a.title === row["Attempt Activity"])
              ?.id || 1;
          const rating =
            ratings.find((r) => r.title === row["Rating"])?.id || 1;
          const decisionOfFaculty =
            decisions.find((d) => d.title === row["Decision of Faculty"])?.id ||
            1;

          const isVerified =
            row["Initial of faculty Name"] && row["Initial of faculty Date"];

          return {
            student_id: student ? student._id : null,
            student_name: row["Student Name"],
            student_email: student ? student.email : "",
            course_id: course.id,
            subject_id: parseInt(subject.id),
            competency_id: competency ? competency.competency_id : 0,
            skill_id: skill.skill_id ? skill.skill_id :  9824,
            skillWiseWork: 1,
            noOfTimeProcedure: 1,
            fromDate: row["From Date"],
            toDate: row["To Date"],
            nameOfActivity: row["Name of Activity (Topic)"],
            fileUrl: "",
            feedbackRecivied: row["Feedback Received"] === "Yes(Y)",
            student_remark: "",
            verified: isVerified,
            created_at: new Date().toISOString(),
            attemptActivity,
            decisionOfFaculty,
            initialFaculty: row["Initial of faculty Name"] || "",
            rating,
            teacher_remark: row["Remark"] || "",
            initialDate: row["Initial of faculty Date"] || "",
            old: true,
          };
        });

        const invalid = processed.filter(
          (d) => !d.student_id || !d.skill_id
        );

        if (invalid.length > 0) {
          setError(
            `Found ${invalid.length} rows with missing student, or skill.`
          );
          setFileData([]);
          console.log(invalid);
          return;
        }

        setFileData(processed);
      } else {
        // Skills
        const processed = jsonData.map((row) => ({
          course_name: row["Course Name"],
          subject_name: row["Subject Title"],
          competency_name: row["Competency (Module) Title"],
          skill_name: row["Skill Name"],
        }));

        setFileData(processed);
      }
    };

    reader.readAsArrayBuffer(file);
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
      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={handleLogSubmit}>
        <div>
          <label>Select Upload Type:</label>
          <select
            value={addType}
            onChange={(e) => setAddType(Number(e.target.value))}
          >
            <option value={1}>Add Logs</option>
            <option value={2}>Add Skills</option>
          </select>
        </div>

        {addType === 1 && (
          <>
            <div>
              <label>Course Name* :</label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => {
                  const newValue = e.target.value.trim();
                  if (!newValue) {
                    setCourse({ title: "", id: 0 });
                    return;
                  }
                  const match = courses.find((c) => c.course_name === newValue);
                  setCourse({
                    title: e.target.value,
                    id: match ? match.course_id : 0,
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
                  setCourse({
                    title: option.course_name,
                    id: option.course_id,
                  });
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
                  if (!newValue) {
                    setSubject({ title: "", id: 0 });
                    return;
                  }
                  const match = subjects.find(
                    (s) => s.subject_name === newValue
                  );
                  setSubject({
                    title: e.target.value,
                    id: match ? match.subject_id : 0,
                  });
                }}
                onFocus={() => setShowOptions2(true)}
                onBlur={() => setTimeout(() => setShowOptions2(false), 100)}
                placeholder="Type or Select Subject Name..."
              />
              <InputList
                active={showOptions2}
                options={course.id !== 0 ? subjects : []}
                onSubmit={(s) => {
                  setSubject({ title: s.subject_name, id: s.subject_id });
                }}
                value={subject.title}
                type={"subject"}
              />
            </div>
          </>
        )}

        <div>
          <label>Upload Excel File:</label>
          <label htmlFor="file-upload" className={styles.file_label}>
            <Image
              src={
                !fileData.length > 0
                  ? "/icons/upload.png"
                  : "/icons/success.png"
              }
              width={30}
              height={30}
              alt="upload"
            />
            {fileData.length > 0 ? "Uploaded! Change?" : "Upload File"}
          </label>
          <input
            type="file"
            id="file-upload"
            accept=".xls, .xlsx"
            onChange={handleFileChange}
          />
        </div>

        <button>
          <Image src="/icons/submit.png" width={50} height={50} alt="submit" />
          Submit
        </button>
      </form>
    </div>
  );
}
