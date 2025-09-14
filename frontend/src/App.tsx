import React, { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import * as pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
// For Vite or Webpack
// import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?worker";

import { GlobalWorkerOptions } from "pdfjs-dist";

// This must be a URL string
GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
import "./App.css";

function App() {
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [copy, setCopy] = useState(false);
  const extractTextFromPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      // Filter items that have the 'str' property (TextItem)
      const strings = content.items
        .filter((item): item is TextItem => "str" in item)
        .map((item) => item.str);

      text += strings.join(" ") + "\n\n";
    }
    return text;
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      const extracted = await extractTextFromPDF(file);
      setResumeText(extracted);
    } else {
      alert("Only PDF resumes are supported.");
    }
  };

  const analyzeResume = async () => {
    if (!resumeText.trim() || !jobText.trim) {
      alert("Please fill in both fields.");
      return;
    }


    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/analyze-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription: jobText }),
      });

      const data = await res.json();
      setAnalysis(data.analysis || "No feedback received.");
    } catch (err) {
      console.error(err);
      alert("Error analyzing resume.");
    } finally {
      setLoading(false);
    }
  };
const copyToClipBoard = async () => {
    try {
      await navigator.clipboard.writeText(analysis);
      setCopy(true);
      setTimeout(() => setCopy(false), 2000);
    } catch (err) {
      alert(`failed to copy the content ${err}`);
    }
  };
  return (
    <div className="container">
      <h1 className="title">Resume Analyzer</h1>

      <input
        type="file"
        onChange={handleFileChange}
        accept=".pdf"
        className="fileInput"
      />

      <textarea
        rows={10}
        placeholder="Paste Job Description here..."
        value={jobText}
        onChange={(e) => setJobText(e.target.value)}
        className="areaStyle"
      />

      <button
        onClick={analyzeResume}
        disabled={loading}
        className="buttonStyle"
      >
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      {loading && <p className="loadingText">Generating AI Suggestions...</p>}

      {analysis && (
        <section className="feedbackCard">
          <h3 >AI Feedback</h3>
          <MDEditor.Markdown source={analysis} className="markdownStyle" />
          <button
            onClick={copyToClipBoard}
            className="copyButton"
            title="Copy feedback to clipboard"
          >
           {copy ? "Copied!" : "Copy"}
          </button>
        </section>
      )}
    </div>
  );
}

export default App;
