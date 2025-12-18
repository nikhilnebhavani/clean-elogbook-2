"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading/page";
import Popup from "@/components/popup/page";
import { useRouter } from "next/navigation";

export default function Login() {
  const session = useSession();
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [popup, setPopup] = useState({
    active: false,
    message: "",
    type: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const tokens = Cookies.get("token");
    const type = Cookies.get("type");
    setToken(tokens);
    if (session.status === "authenticated" && !token) {
      alert("no ok");
      setEmail(session.data.user.email);
      setLoading(true);
      setLogin(true);
    } else if (tokens) {
      if (type === "student") {
        router.push("/student/home");
      } else if (type === "teacher") {
        router.push("/teacher/home");
      } else if (type === "admin") {
        router.push("/admin/home");
      }
    }
  }, [session, token]);

  async function checkUser() {
    setLoading(true);
    try {
      const response = await fetch(`${backend_url}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mode: "google" }),
      });

      const data = await response.json();

      if (response.status === 200) {
        Cookies.set("token", data.token);
        Cookies.set("type", data.type);

        if (data.type === "student") {
          setToken(data.token);
        } else if (data.type === "teacher") {
          router.push("/teacher/home");
        } else if (data.type === "admin") {
          router.push("/admin/home");
        } else {
          // Handle unknown user type
          Cookies.remove("token");
          Cookies.remove("type");
          handleLoginError("Invalid User Type");
        }
      } else {
        handleLoginError(data.error);
      }
    } catch (error) {
      handleLoginError();
    } finally {
      setLoading(false);
    }
  }

  function handleLoginError(errorType = "Server Problem") {
    setPopup({
      active: true,
      type:
        errorType === "Email Not Found"
          ? "no-found"
          : errorType === "Incorrect Password"
          ? "wrong"
          : errorType === "Invalid User Type"
          ? "error"
          : "error",
      message:
        errorType === "Email Not Found"
          ? "User Not Found"
          : errorType === "Incorrect Password"
          ? "Incorrect Password"
          : errorType === "Invalid User Type"
          ? "Invalid User Type"
          : "Server Problem",
    });
  }

  useEffect(() => {
    if (login) {
      checkUser();
    }
  }, [login]);

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (email === "" || password === "") {
      setError("Please fill all the fields");
      setLoading(false);
      return;
    } else if (!isValidEmail(email)) {
      setLoading(false);
      setError("Enter Valid Email");
      return;
    } else {
      setError("");
    }
    try {
      const loginResponse = await fetch(`${backend_url}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          mode: "manual",
        }),
      });
      const data = await loginResponse.json();

      if (loginResponse.status === 200) {
        Cookies.set("token", data.token);
        Cookies.set("type", data.type);
        if (data.type === "student") {
          setToken(data.token);
        } else if (data.type === "teacher") {
          router.push("/teacher/home");
        } else if (data.type === "admin") {
          router.push("/admin/home");
        } else {
          // Handle unknown user type
          Cookies.remove("token");
          Cookies.remove("type");
          handleLoginError("Invalid User Type");
        }
        setLoading(false);
      } else {
        setLoading(false);
        handleLoginError(data.error);
      }
    } catch (error) {
      handleLoginError();
    } finally {
      setLoading(false);
    }
  };

  const handlePopupClose = () => {
    if (login) {
      signOut();
    }
    setPopup({ active: false, message: "", type: "" });
  };

  return (
    <main className={styles.main}>
      <Loading active={loading} />
      <Popup
        active={popup.active}
        type={popup.type}
        message={popup.message}
        onClose={handlePopupClose}
      />
      <div className={styles.flex}>
        <div className={styles.h_screen}>
          <Image
            src="/GatePic.png"
            width={1000}
            height={1000}
            alt="Picture of Gate"
          />
        </div>
        <div className={styles.signin_sec}>
          <Image
            width={500}
            height={100}
            src="/logo2.png"
            alt="pulogo"
            className={styles.logo}
          />

          <div className={styles.signintxt}>
            <div>
              <h2>Login,</h2>
              <p>Welcome back, To E-logbook</p>
            </div>
            <div
              className={styles.signin_btn}
              onClick={() => {
                signIn();
                setGoogle(true);
              }}
            >
              <Image
                width={100}
                height={100}
                src="/plus.png"
                alt="googlelogo"
              />
              <p>Sign in with Google</p>
            </div>
            <span className={styles.or}>or</span>
            <form className={styles.login_form}>
              <p>{error}</p>
              <input
                type="text"
                placeholder="Enter Your Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                autoFocus={true}
              />
              <input
                type="text"
                placeholder="Enter Your Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
              <button onClick={handleLogin}>Login</button>
            </form>
            <p className={styles.forgot}>forgot password ?</p>
          </div>
        </div>
      </div>
    </main>
  );
}
