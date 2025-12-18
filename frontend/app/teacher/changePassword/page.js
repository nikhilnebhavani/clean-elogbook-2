"use client";
import React, { useState } from "react";
import styles from "./changePassword.module.css";
import Navbar from "@/components/navbar/page";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";

export default function Dashboard() {
  const router = useRouter();
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [conformPassword, setConformPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    active: false,
    type: "",
    message: "",
  });

  const handleStudentData = (studentData) => {
    setToken(studentData.token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== conformPassword) {
      setError("Password and Conform Password should be same");
      return;
    } else {
      setLoading(true);
      const changePassword = await fetch(
        `${backend_url}/changeTPassword`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        }
      );
      const message = await changePassword.json();
      if (message.ok) {
        setLoading(false);
        setPopup({
          active: true,
          type: "success",
          message: "Your Password Changed Successfully",
        });
      } else {
        setError(message.message);
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.main}>
      <Navbar onSubmit={handleStudentData} />
      <Loading active={loading} />
      <Popup
        active={popup.active}
        type={popup.type}
        message={popup.message}
        onClose={() => {
          setPopup({ active: false, type: "", message: "" });
          router.push("/teacher/home");
        }}
      />
      <div className={styles.main_box}>
        <h2>Change Password</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <p className={styles.error}>{error}</p>
          <div>
            <label>Password :</label>
            <input
              type="password"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              required
            />
          </div>
          <div>
            <label>Conform Password :</label>
            <input
              type="password"
              onChange={(e) => {
                setConformPassword(e.target.value);
              }}
              required
            />
          </div>
          <br />
          <div>
            <button>Change</button>
            <button
              className={styles.cancel}
              type="button"
              onClick={() => {
                router.push("/teacher/home");
              }}
            >
              Go Home
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
