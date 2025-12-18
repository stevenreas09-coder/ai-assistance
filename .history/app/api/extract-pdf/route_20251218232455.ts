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
    const buffer = Buffer.from(arrayBuffer);

    // ✅ Cast to any to satisfy TypeScript
    const loadingTask = pdfjs.getDocument({
      data: buffer,
    } as any);

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
      { error: "Failed to parse PDF", details: error.message },
      { status: 500 }
    );
  }
}
