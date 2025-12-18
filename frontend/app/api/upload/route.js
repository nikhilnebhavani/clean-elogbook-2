import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const uploadDir = path.join(process.cwd(), "public/uploads");

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No valid file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFilename = `${uuidv4()}.pdf`;
    const filePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({
      message: "File uploaded successfully",
      url: fileUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
