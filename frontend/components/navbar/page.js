"use client";
import React, { useEffect, useState } from "react";
import styles from "./nav.module.css";
import Image from "next/image";
import { signOut } from "next-auth/react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function Navbar({ onSubmit }) {
  const [token, setToken] = useState("");
  const [type, setType] = useState("");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [enroll, setEnroll] = useState(0);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [skills, setSkills] = useState([]);
  const [admins, setAdmins] = useState([]);
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const token = Cookies.get("token");
    const type = Cookies.get("type");
    if (token && type === "student") {
      setToken(token);
      setType("student");
      getStudentData(token);
    } else if (token && type === "teacher") {
      setToken(token);
      setType("teacher");
      getTeacherData(token);
    } else if (token && type === "admin") {
      setToken(token);
      setType("admin");
      getAdminData(token);
    } else {
      router.push("/");
    }
    async function getStudentData(token) {
      const student_data = await fetch(`${backend_url}/getStudentInfo`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const student = await student_data.json();
      setEmail(student.email);
      setName(student.name);
      setEnroll(student.enroll);
      setCourses(student.courses);
      if (student_data.status === 404) {
        Cookies.remove("token");
        Cookies.remove("type");
        router.push("/");
      }
    }
    async function getTeacherData(token) {
      const teacher_data = await fetch(`${backend_url}/getTeacherInfo`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const teacher = await teacher_data.json();
      setEmail(teacher.email);
      setName(teacher.name);
      setStudents(teacher.students);
      setCourses(teacher.courses);
      if (teacher_data.status === 404) {
        Cookies.remove("token");
        Cookies.remove("type");
        router.push("/");
      }
    }
    async function getAdminData(token) {
      const response = await fetch(`${backend_url}/getAGeneral`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();

      if (response.ok) {
        setEmail(data.admin.email);
        setName(data.admin.name);
        setStudents(data.students || []);
        setCourses(data.courses || []);
        setTeachers(data.teachers || []);
        setSubjects(data.subjects || []);
        setCompetencies(data.competencies || []);
        setSkills(data.skills || []);
        setAdmins(data.admins || []);
      } else {
        // If admin not found or unauthorized, redirect to login
        Cookies.remove("token");
        Cookies.remove("type");
        router.push("/");
      }
    }
  }, []);

  useEffect(() => {
    onSubmit(
      type == "student"
        ? { name, email, enroll, token, courses }
        : type == "teacher"
        ? { name, email, students, token, courses }
        : type == "admin"
        ? {
            name,
            email,
            students,
            token,
            courses,
            teachers,
            subjects,
            competencies,
            skills,
            admins,
          }
        : {}
    );
  }, [
    name,
    email,
    students,
    token,
    courses,
    teachers,
    subjects,
    competencies,
    skills,
    admins,
  ]);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Image
          src="/logo2.png"
          alt="Parul University Logo"
          width={500}
          height={500}
          onClick={() => {
            type == "student"
              ? router.push("/student/home")
              : type == "teacher"
              ? router.push("/teacher/home")
              : router.push("/admin/home");
          }}
        />
      </div>
      <div className={styles.headerUserDetails}>
        <p>
          {name} {type == "student" && `(${enroll})`}
        </p>
        <Image
          src="/user-icon.png"
          alt="User Icon"
          width={30}
          height={30}
          className={styles.headerIcon}
        />

        <div className={styles.dropdown}>
          <button
            onClick={() => {
              type == "student"
                ? router.push("/student/changePassword")
                : type == "teacher"
                ? router.push("/teacher/changePassword")
                : router.push("/admin/changePassword");
            }}
          >
            Change Password
          </button>
          <button
            onClick={() => {
              router.push("/");
              Cookies.remove("token");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
