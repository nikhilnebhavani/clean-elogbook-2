// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const clientPromise = require("./lib/mongodb"); // MongoDB connection file

const app = express();

// ==== Middleware ====
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// ==== CORS ====
const allowedOrigins = [
  "http://localhost:3000",
  "https://elogbook.parulsevashramhospital.com",
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ==== Health Check Routes ====
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/dbping", async (_req, res) => {
  try {
    const client = await clientPromise;
    const r = await client.db("admin").command({ ping: 1 });
    res.json({ ok: 1, r });
  } catch (e) {
    res.status(500).json({ ok: 0, error: e.message });
  }
});

// ==== Connect DB, Attach Routes, Start Server ====
(async () => {
  try {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME || "elogbook";
    const db = client.db(dbName);
    console.log(`✅ MongoDB connected (db="${dbName}")`);

    // Make db available to routes
    app.use((req, _res, next) => {
      req.db = db;
      next();
    });

    // ==== Root ====
    app.get("/", (_req, res) => {
      res.send("E Logbook Is Running");
    });

    // ==== Routes ====
    const loginRouter = require("./routes/login/route");
    app.use("/login", loginRouter);

    const addLog = require("./routes/student/addLog/route");
    app.use("/addLog", addLog);

    const updateLog = require("./routes/student/updateLog/route");
    app.use("/updateLog", updateLog);

    const getStudentInfo = require("./routes/student/getStudentInfo/route");
    app.use("/getStudentInfo", getStudentInfo);

    const changePassword = require("./routes/student/changePassword/route");
    app.use("/changePassword", changePassword);

    const getGeneral = require("./routes/student/getGeneral/route");
    app.use("/getGeneral", getGeneral);

    const getLogs = require("./routes/student/getLogs/route");
    app.use("/getLogs", getLogs);

    const getLog = require("./routes/student/getLog/route");
    app.use("/getLog", getLog);

    const getScore = require("./routes/student/getScore/route");
    app.use("/getScore", getScore);

    const getSummary = require("./routes/student/getSummary/route");
    app.use("/getSummary", getSummary);

    const addTLog = require("./routes/teacher/addLog/route");
    app.use("/addTLog", addTLog);

    const updateTLog = require("./routes/teacher/updateLog/route");
    app.use("/updateTLog", updateTLog);

    const getTeacherInfo = require("./routes/teacher/getTeacherInfo/route");
    app.use("/getTeacherInfo", getTeacherInfo);

    const changeTPassword = require("./routes/teacher/changePassword/route");
    app.use("/changeTPassword", changeTPassword);

    const getTGeneral = require("./routes/teacher/getGeneral/route");
    app.use("/getTGeneral", getTGeneral);

    const getTLogs = require("./routes/teacher/getLogs/route");
    app.use("/getTLogs", getTLogs);

    const getTLog = require("./routes/teacher/getLog/route");
    app.use("/getTLog", getTLog);

    const getTScore = require("./routes/teacher/getScore/route");
    app.use("/getTScore", getTScore);

    const getTSummary = require("./routes/teacher/getSummary/route");
    app.use("/getTSummary", getTSummary);

    const addTCompetency = require("./routes/teacher/addCompetency/route");
    app.use("/addTCompetency", addTCompetency);

    const addTSkill = require("./routes/teacher/addSkill/route");
    app.use("/addTSkill", addTSkill);

    const getTStudents = require("./routes/teacher/getStudents/route");
    app.use("/getTStudents", getTStudents);

    const addTTitle = require("./routes/teacher/addTitle/route");
    const updateTTitle = require("./routes/teacher/updateTitle/route");
    const deleteTTitle = require("./routes/teacher/deleteTitle/route");
    const updateTScore = require("./routes/teacher/updateScore/route");
    app.use("/addTTitle", addTTitle);
    app.use("/updateTTitle", updateTTitle);
    app.use("/deleteTTitle", deleteTTitle);
    app.use("/updateTScore", updateTScore);

    const activeTCompetency = require("./routes/teacher/activeCompetency/route");
    app.use("/activeTCompetency", activeTCompetency);

    const updateTCompetency = require("./routes/teacher/updateCompetency/route");
    app.use("/updateTCompetency", updateTCompetency);

    const activeTSkill = require("./routes/teacher/activeSkill/route");
    app.use("/activeTSkill", activeTSkill);

    const updateTSkill = require("./routes/teacher/updateSkill/route");
    app.use("/updateTSkill", updateTSkill);

    const addALog = require("./routes/admin/addLog/route");
    app.use("/addALog", addALog);

    const updateALog = require("./routes/admin/updateLog/route");
    app.use("/updateALog", updateALog);

    const changeAPassword = require("./routes/admin/changePassword/route");
    app.use("/changeAPassword", changeAPassword);

    const getAGeneral = require("./routes/admin/getGeneral/route");
    app.use("/getAGeneral", getAGeneral);

    const getALogs = require("./routes/admin/getLogs/route");
    app.use("/getALogs", getALogs);

    const getALog = require("./routes/admin/getLog/route");
    app.use("/getALog", getALog);

    const getAScore = require("./routes/admin/getScore/route");
    app.use("/getAScore", getAScore);

    const getASummary = require("./routes/admin/getSummary/route");
    app.use("/getASummary", getASummary);

    const addACompetency = require("./routes/admin/addCompetency/route");
    app.use("/addACompetency", addACompetency);

    const updateACompetency = require("./routes/admin/updateCompetency/route");
    app.use("/updateACompetency", updateACompetency);

    const addASkill = require("./routes/admin/addSkill/route");
    app.use("/addASkill", addASkill);

    const updateASkill = require("./routes/admin/updateSkill/route");
    app.use("/updateASkill", updateASkill);

    const getAStudents = require("./routes/admin/getStudents/route");
    app.use("/getAStudents", getAStudents);

    const addAStudent = require("./routes/admin/addStudent/route");
    app.use("/addAStudent", addAStudent);

    const bulkAAddStudents = require("./routes/admin/bulkAddStudents/route");
    app.use("/bulkAAddStudents", bulkAAddStudents);

    const updateAStudent = require("./routes/admin/updateStudent/route");
    app.use("/updateAStudent", updateAStudent);

    const deleteAStudent = require("./routes/admin/deleteStudent/route");
    app.use("/deleteAStudent", deleteAStudent);

    const getACourses = require("./routes/admin/getCourses/route");
    app.use("/getACourses", getACourses);

    const addACourse = require("./routes/admin/addCourse/route");
    app.use("/addACourse", addACourse);

    const bulkAAddCourses = require("./routes/admin/bulkAddCourses/route");
    app.use("/bulkAAddCourses", bulkAAddCourses);

    const updateACourse = require("./routes/admin/updateCourse/route");
    app.use("/updateACourse", updateACourse);

    const deleteACourse = require("./routes/admin/deleteCourse/route");
    app.use("/deleteACourse", deleteACourse);

    const addATitle = require("./routes/admin/addTitle/route");
    app.use("/addATitle", addATitle);

    const addAOldLogs = require("./routes/admin/addOldLogs/route");
    app.use("/addAOldLogs", addAOldLogs);

    const addAAdmin = require("./routes/admin/addAdmin/route");
    app.use("/addAAdmin", addAAdmin);

    const bulkAAddAdmins = require("./routes/admin/bulkAddAdmins/route");
    app.use("/bulkAAddAdmins", bulkAAddAdmins);

    const updateAAdmin = require("./routes/admin/updateAdmin/route");
    app.use("/updateAAdmin", updateAAdmin);

    const deleteAAdmin = require("./routes/admin/deleteAdmin/route");
    app.use("/deleteAAdmin", deleteAAdmin);

    const getAAdmins = require("./routes/admin/getAdmins/route");
    app.use("/getAAdmins", getAAdmins);

    const addATeacher = require("./routes/admin/addTeacher/route");
    app.use("/addATeacher", addATeacher);

    const bulkAAddTeachers = require("./routes/admin/bulkAddTeachers/route");
    app.use("/bulkAAddTeachers", bulkAAddTeachers);

    const updateATeacher = require("./routes/admin/updateTeacher/route");
    app.use("/updateATeacher", updateATeacher);

    const deleteATeacher = require("./routes/admin/deleteTeacher/route");
    app.use("/deleteATeacher", deleteATeacher);

    const getATeachers = require("./routes/admin/getTeachers/route");
    app.use("/getATeachers", getATeachers);

    const assignASubjects = require("./routes/admin/assignSubjects/route");
    app.use("/assignASubjects", assignASubjects);

    const assignACourses = require("./routes/admin/assignCourses/route");
    app.use("/assignACourses", assignACourses);

    const assignAStudentTeacher = require("./routes/admin/assignStudentTeacher/route");
    app.use("/assignAStudentTeacher", assignAStudentTeacher);

    const assignAStudentSubjects = require("./routes/admin/assignStudentSubjects/route");
    app.use("/assignAStudentSubjects", assignAStudentSubjects);

    const getASubjects = require("./routes/admin/getSubjects/route");
    app.use("/getASubjects", getASubjects);

    const addASubject = require("./routes/admin/addSubject/route");
    app.use("/addASubject", addASubject);

    const updateASubject = require("./routes/admin/updateSubject/route");
    app.use("/updateASubject", updateASubject);

    const deleteASubject = require("./routes/admin/deleteSubject/route");
    app.use("/deleteASubject", deleteASubject);

    const bulkAAddSubjects = require("./routes/admin/bulkAddSubjects/route");
    app.use("/bulkAAddSubjects", bulkAAddSubjects);

    const bulkAAddSkills = require("./routes/admin/bulkskills/route");
    app.use("/bulkAAddSkills", bulkAAddSkills);

    const dashboard = require("./routes/admin/dashboard/route");
    app.use("/dashboard", dashboard);

    // ==== 404 & Error Handlers ====
    app.use((req, res) => res.status(404).json({ error: "Not Found" }));
    app.use((err, _req, res, _next) => {
      console.error("Unhandled error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    });

    // ==== Start Server ====
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // ==== Graceful Shutdown ====
    const shutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down...`);
      try {
        await client.close();
      } catch {}
      process.exit(0);
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
})();
