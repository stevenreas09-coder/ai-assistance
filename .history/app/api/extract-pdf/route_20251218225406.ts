import { NextRequest, NextResponse } from "next/server";

// Use 'require' to avoid the "no default export" ESM error
const pdf = require("pdf-parse");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert the File object to a Node.js Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF using the required module
    // pdf-parse returns a promise that resolves to an object containing 'text'
    const data = await pdf(buffer);

    // Return the raw text to your frontend
    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    console.error("PDF extraction error:", error);
    return NextResponse.json(
      { error: "Failed to parse PDF", details: error.message },
      { status: 500 }
    );
  }
}
