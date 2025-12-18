import { NextRequest, NextResponse } from "next/server";

// 1. Use the legacy build for Node.js environments
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Load the PDF document
    const loadingTask = pdfjs.getDocument({
      data: buffer,
      useSystemFonts: true, // Helps with standard PDF fonts
      disableFontFace: true, // Prevents trying to load fonts in Node.js
    });

    const pdf = await loadingTask.promise;
    let fullText = "";

    // 3. Loop through pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Extract string items from the text content
      const pageText = textContent.items.map((item: any) => item.str).join(" ");

      fullText += pageText + "\n";
    }

    return NextResponse.json({ text: fullText.trim() });
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json(
      { error: "Failed to parse PDF", details: error.message },
      { status: 500 }
    );
  }
}
