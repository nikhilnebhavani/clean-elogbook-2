"use client";
import { useEffect, useState } from "react";
import styles from "./sidebar.module.css";
import Image from "next/image";

export default function Sidebar({onSubmit}) {
  const [option, setOption] = useState(0);

  useEffect(()=>{
    onSubmit(option)
  },[option])

  return (
    <div className={styles.sider}>
      <ul className={styles.headerLeft}>
        <li
          className={option == 0 ? styles.active : ""}
          onClick={() => {
            setOption(0);
          }}
        >
          Manage Admins
        </li>
        <li
          className={option == 1 ? styles.active : ""}
          onClick={() => {
            setOption(1);
          }}
        >
          Manage Teachers
        </li>
        <li
          className={option == 2 ? styles.active : ""}
          onClick={() => {
            setOption(2);
          }}
        >
          Manage Students
        </li>
        <li
          className={option == 3 ? styles.active : ""}
          onClick={() => {
            setOption(3);
          }}
        >
          Manage Courses
        </li>
        <li
          className={option == 4 ? styles.active : ""}
          onClick={() => {
            setOption(4);
          }}
        >
          Manage Subjects
        </li>
        <li
          className={option == 5 ? styles.active : ""}
          onClick={() => {
            setOption(5);
          }}
        >
          Manage Competency
        </li>
        <li
          className={option == 6 ? styles.active : ""}
          onClick={() => {
            setOption(6);
          }}
        >
          Manage Skill
        </li>
        <li
          className={option == 7 ? styles.active : ""}
          onClick={() => {
            setOption(7);
          }}
        >
          Teacher Assign Subject
        </li>
        <li
          className={option == 8 ? styles.active : ""}
          onClick={() => {
            setOption(8);
          }}
        >
          Course Assign Student
        </li>
        <li
          className={option == 9 ? styles.active : ""}
          onClick={() => {
            setOption(9);
          }}
        >
          Student Assign Subject
        </li>
        <li
          className={option == 10 ? styles.active : ""}
          onClick={() => {
            setOption(10);
          }}
        >
          Student Assign Teacher
        </li>
        <li
          className={option == 11 ? styles.active : ""}
          onClick={() => {
            setOption(11);
          }}
        >
          Student's Logs
        </li>
        <li
          className={option == 12 ? styles.active : ""}
          onClick={() => {
            setOption(12);
          }}
        >
          Dashboard
        </li>

        <li
          className={option == 13 ? styles.active : ""}
          onClick={() => {
            setOption(13);
          }}
        >
          Old Data Upload
        </li>
      </ul>
    </div>
  );
}
