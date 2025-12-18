"use client";
import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";



export default function Dashboard() {

  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [data, setData] = useState({
    students: 0,
    teachers: 0,
    logs: 0,
    skills: 0,
    competencies: 0,
    subjects: 0,
    courses: 0,
  });

  useEffect(() => {
    // Replace this with real API call
    async function fetchData() {
      try {
        const response = await fetch(`${backend_url}/dashboard`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    }

    fetchData();
  }, []);

  const cards = [
    { label: "Students", value: data.students },
    { label: "Teachers", value: data.teachers },
    { label: "Logs", value: data.logs },
    { label: "Skills", value: data.skills },
    { label: "Competencies", value: data.competencies },
    { label: "Subjects", value: data.subjects },
    { label: "Courses", value: data.courses },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Dashboard</h1>
      <div className={styles.grid}>
        {cards.map((card, index) => (
          <div key={index} className={styles.card}>
            <p className={styles.label}>{card.label}</p>
            <p className={styles.value}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
