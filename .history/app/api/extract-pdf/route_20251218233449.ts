import { NextRequest, NextResponse } from "next/server";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // ✅ pdfjs requires Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);

    // ✅ MUST disable worker in Next.js Node runtime
    const loadingTask = (pdfjs as any).getDocument({
      data: uint8Array,
      disableWorker: true,
    });

    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return NextResponse.json({ text: fullText.trim() });
  } catch (error: any) {
    console.error("PDF parsing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse PDF" },
      { status: 500 }
    );
  }
}
