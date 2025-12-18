import { NextRequest, NextResponse } from "next/server";
import * as pdfjs from "pdfjs-dist";

// Point to the worker file (essential for the library to work)
// @ts-ignore
import("pdfjs-dist/build/pdf.worker.mjs");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();

    // Load the document
    const loadingTask = pdfjs.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;

    let fullText = "";

    // Loop through every page to get text
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return NextResponse.json({ text: fullText });
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
