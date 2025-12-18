"use client";
import Image from "next/image";
import { useState } from "react";
import styles from "./page.module.css";
import Navbar from "@/components/navbar/page";
import Sidebar from "@/components/teacher/sidebar/page";
import MyStudents from "@/components/teacher/mystudents/page";
import ManageCompetency from "@/components/teacher/manageCompetency/page";
import ManageSkill from "@/components/teacher/manageSkill/page";
import ManageScoreCard from "@/components/teacher/manageScoreCard/page";
import ManageLogs from "@/components/teacher/manageLogs/page";
import Scoring from "@/components/teacher/scoring/page";

export default function Home() {
  const [token, setToken] = useState("");
  const [option, setOption] = useState(0);

  const handleTeacherData = (teacher_data) => {
    setToken(teacher_data.token);
  };

  const handleOption = (option) => {
    setOption(option);
  };

  return (
    <div className={styles.main}>
      <Navbar onSubmit={handleTeacherData} />
      <div className={styles.page}>
        <Sidebar onSubmit={handleOption} />
        <div className={styles.rightBox}>
          {option == 0 ? (
            <MyStudents token={token} />
          ) : option == 1 ? (
            <ManageLogs token={token} />
          ) : option == 2 ? (
            <ManageScoreCard token={token} />
          ) : option == 3 ? (
            <Scoring token={token} />
          ) : option == 4 ? (
            <ManageCompetency token={token} />
          ) : (
            <ManageSkill token={token} />
          )}
        </div>
      </div>
    </div>
  );
}
