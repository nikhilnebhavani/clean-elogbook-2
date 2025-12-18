"use client";
import { useState } from "react";
import styles from "./page.module.css";
import Navbar from "@/components/navbar/page";
import Sidebar from "@/components/admin/sidebar/page";
import ManageStudents from "@/components/admin/managestudents/page";
import ManageCompetency from "@/components/admin/manageCompetency/page";
import ManageSkill from "@/components/admin/manageSkill/page";
import ManageLogs from "@/components/admin/manageLogs/page";
import ManageOldData from "@/components/admin/manageOldData/page";
import ManageAdmins from "@/components/admin/manageAdmins/page";
import ManageTeachers from "@/components/admin/manageTeachers/page";
import ManageCourses from "@/components/admin/manageCourses/page";
import ManageSubjects from "@/components/admin/manageSubjects/page";
import AssignSubjects from "@/components/admin/assignSubjects/page";
import AssignCourses from "@/components/admin/assignCourses/page";
import AssignStudentSubjects from "@/components/admin/assignStudentSubjects/page";
import AssignStudentTeacher from "@/components/admin/assignStudentTeacher/page";
import Dashboard from "@/components/admin/dashboard/page";

export default function Home() {
  const [token, setToken] = useState("");
  const [option, setOption] = useState(0);
  const [data, setData] = useState(null);

  const handleAdminData = (admin_data) => {
    setToken(admin_data.token);
    setData(admin_data);
  };

  const handleOption = (option) => {
    setOption(option);
  };

  return (
    <div className={styles.main}>
      <Navbar onSubmit={handleAdminData} />
      <div className={styles.page}>
        <Sidebar onSubmit={handleOption} />
        <div className={styles.rightBox}>
          {option == 0 ? (
            <ManageAdmins token={token} data={data} />
          ) : option == 1 ? (
            <ManageTeachers token={token} data={data} />
          ) : option == 2 ? (
            <ManageStudents token={token} data={data} />
          ) : option == 3 ? (
            <ManageCourses token={token} data={data} />
          ) : option == 4 ? (
            <ManageSubjects token={token} data={data} />
          ) : option == 5 ? (
            <ManageCompetency token={token} />
          ) : option == 6 ? (
            <ManageSkill token={token} />
          ) : option == 7 ? (
            <AssignSubjects token={token} />
          ) : option == 8 ? (
            <AssignCourses token={token} />
          ) : option == 9 ? (
            <AssignStudentSubjects token={token} />
          ) : option == 10 ? (
            <AssignStudentTeacher token={token} />
          ) : option == 11 ? (
            <ManageLogs token={token} />
          ) 
          : option == 12 ? (
            <Dashboard token={token} />
          ) : (
            <ManageOldData token={token} />
          )}
        </div>
      </div>
    </div>
  );
}
