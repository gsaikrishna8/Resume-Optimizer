const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
// const fetch = require("node-fetch");
dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
const PORT = 8000;
app.post("/analyze-resume", async (req, res) => {
  const { resumeText, jobDescription } = req.body;

const prompt = `
You are a professional resume analyzer.

Given the following resume:
------
${resumeText}
------

And the following job description:
------
${jobDescription}
------

Please analyze and return feedback in **clean, readable markdown format**. Follow this structure exactly:

## 1. Evaluation of how well the resume matches the job
- List key matching skills or experience with short, clear points.
- Avoid redundancy and keep bullets concise.

## 2. Missing or suggested skills to add
- Bullet points for each missing or recommended skill.
- Be specific and job-relevant.

## 3. Suggestions for improvements to bullet points (if any)
For each weak or vague bullet point in the resume:
- Quote the original bullet in bold.
- Below it, provide a clearly indented suggestion starting with "→", without creating unnecessary space or bullets.
Example:
**"Implemented backend services"**  
→ Specify which services, tech stack, or results. Example: "Developed REST APIs using Spring Boot, improving data access speed by 40%."

## 4. An optimized summary paragraph
- A 3–4 sentence impactful summary written in a professional tone, highlighting strengths and alignment with the job.

Ensure:
- No extra whitespace between bullets.
- Clear visual structure (headings, indentation, bold quotes).
- Markdown renders cleanly.
`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "resume-optimizer",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Unexpected API response:", data);
      return res
        .status(500)
        .json({ error: "AI model did not return a valid response." });
    }

    const aiReply = data.choices[0].message.content;
    const cleanedReply = aiReply.replace(/\n\s*\n/g, "\n\n").trim();
    res.json({ analysis: cleanedReply });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
