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
        <li className={option==0 ? styles.active : ""} onClick={()=>{setOption(0)}}>My Students</li>
        <li className={option==1 ? styles.active : ""} onClick={()=>{setOption(1)}}>Student's Logs</li>
        <li className={option==2 ? styles.active : ""} onClick={()=>{setOption(2)}}>Score Card</li>
        <li className={option==3 ? styles.active : ""} onClick={()=>{setOption(3)}}>Scoring</li>
        <li className={option==4 ? styles.active : ""} onClick={()=>{setOption(4)}}>Manage Competency</li>
        <li className={option==5 ? styles.active : ""} onClick={()=>{setOption(5)}}>Manage Skill</li>
      </ul>
    </div>
  );
}
