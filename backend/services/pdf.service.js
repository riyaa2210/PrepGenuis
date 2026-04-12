const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

exports.generateResumePDF = async (resumeData) => {
  const { parsed, skillTags, atsScore } = resumeData;
  const p = parsed || {};

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; font-size: 11px; color: #222; padding: 30px 40px; }
  h1 { font-size: 22px; color: #1a1a2e; }
  h2 { font-size: 13px; color: #16213e; border-bottom: 1.5px solid #0f3460; padding-bottom: 3px; margin: 14px 0 6px; text-transform: uppercase; letter-spacing: 1px; }
  .contact { color: #555; font-size: 10px; margin-top: 4px; }
  .section { margin-bottom: 10px; }
  .item { margin-bottom: 8px; }
  .item-title { font-weight: bold; }
  .item-sub { color: #555; font-size: 10px; }
  .skills { display: flex; flex-wrap: wrap; gap: 5px; }
  .skill-tag { background: #e8f4fd; color: #0f3460; padding: 2px 8px; border-radius: 10px; font-size: 10px; }
  .ats { background: #f0fff4; border: 1px solid #68d391; padding: 6px 10px; border-radius: 6px; margin-top: 10px; font-size: 10px; }
</style>
</head>
<body>
  <h1>${p.name || 'Candidate Name'}</h1>
  <div class="contact">${[p.email, p.phone, p.location].filter(Boolean).join(' | ')}</div>

  ${p.summary ? `<div class="section"><h2>Summary</h2><p>${p.summary}</p></div>` : ''}

  ${skillTags?.length ? `<div class="section"><h2>Skills</h2><div class="skills">${skillTags.map((s) => `<span class="skill-tag">${s}</span>`).join('')}</div></div>` : ''}

  ${p.experience?.length ? `<div class="section"><h2>Experience</h2>${p.experience.map((e) => `<div class="item"><div class="item-title">${e.role} — ${e.company}</div><div class="item-sub">${e.duration}</div><p>${e.description || ''}</p></div>`).join('')}</div>` : ''}

  ${p.education?.length ? `<div class="section"><h2>Education</h2>${p.education.map((e) => `<div class="item"><div class="item-title">${e.degree}</div><div class="item-sub">${e.institution} | ${e.year}</div></div>`).join('')}</div>` : ''}

  ${p.projects?.length ? `<div class="section"><h2>Projects</h2>${p.projects.map((pr) => `<div class="item"><div class="item-title">${pr.name}</div><p>${pr.description || ''}</p><div class="item-sub">Tech: ${(pr.technologies || []).join(', ')}</div></div>`).join('')}</div>` : ''}

  ${p.certifications?.length ? `<div class="section"><h2>Certifications</h2><ul>${p.certifications.map((c) => `<li>${c}</li>`).join('')}</ul></div>` : ''}

  ${atsScore ? `<div class="ats">ATS Compatibility Score: <strong>${atsScore}/100</strong></div>` : ''}
</body>
</html>`;

  const outputDir = path.join('uploads', 'pdfs');
  ensureDir(outputDir);
  const filename = `resume-${Date.now()}.pdf`;
  const outputPath = path.join(outputDir, filename);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
  await browser.close();

  return outputPath;
};

exports.generateInterviewReportPDF = async (interview) => {
  const sc = interview.scorecard || {};
  const scoreBar = (score) => {
    const pct = (score / 10) * 100;
    const color = score >= 7 ? '#48bb78' : score >= 4 ? '#ed8936' : '#fc8181';
    return `<div style="background:#eee;border-radius:4px;height:8px;width:200px;display:inline-block;vertical-align:middle;"><div style="background:${color};width:${pct}%;height:100%;border-radius:4px;"></div></div> <span style="font-size:11px;">${score}/10</span>`;
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #222; padding: 30px 40px; }
  h1 { font-size: 20px; color: #1a1a2e; margin-bottom: 4px; }
  h2 { font-size: 13px; color: #16213e; border-bottom: 1.5px solid #0f3460; padding-bottom: 3px; margin: 16px 0 8px; text-transform: uppercase; }
  .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
  .score-row { display: flex; align-items: center; margin-bottom: 8px; gap: 12px; }
  .score-label { width: 160px; font-weight: bold; }
  .qa-item { margin-bottom: 14px; padding: 10px; background: #f9f9f9; border-radius: 6px; border-left: 3px solid #0f3460; }
  .q { font-weight: bold; margin-bottom: 4px; }
  .a { color: #444; margin-bottom: 4px; }
  .feedback { color: #2d6a4f; font-size: 11px; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin: 2px; }
  .strength { background: #c6f6d5; color: #276749; }
  .improve { background: #fed7d7; color: #9b2335; }
  .summary-box { background: #ebf8ff; border: 1px solid #90cdf4; padding: 12px; border-radius: 8px; margin-top: 10px; }
</style>
</head>
<body>
  <h1>Interview Report</h1>
  <div class="meta">
    Candidate: ${interview.candidate?.name || 'N/A'} &nbsp;|&nbsp;
    Round: ${interview.round?.toUpperCase()} &nbsp;|&nbsp;
    Date: ${new Date(interview.createdAt).toLocaleDateString()} &nbsp;|&nbsp;
    Duration: ${Math.round((interview.duration || 0) / 60)} min
  </div>

  <h2>Scorecard</h2>
  <div class="score-row"><span class="score-label">Overall Score</span>${scoreBar(sc.overallScore || 0)}</div>
  <div class="score-row"><span class="score-label">Technical</span>${scoreBar(sc.technicalScore || 0)}</div>
  <div class="score-row"><span class="score-label">Communication</span>${scoreBar(sc.communicationScore || 0)}</div>
  <div class="score-row"><span class="score-label">Confidence</span>${scoreBar(sc.confidenceScore || 0)}</div>
  <div class="score-row"><span class="score-label">Clarity</span>${scoreBar(sc.clarityScore || 0)}</div>

  ${sc.strengths?.length ? `<h2>Strengths</h2><div>${sc.strengths.map((s) => `<span class="tag strength">${s}</span>`).join('')}</div>` : ''}
  ${sc.improvements?.length ? `<h2>Areas for Improvement</h2><div>${sc.improvements.map((s) => `<span class="tag improve">${s}</span>`).join('')}</div>` : ''}

  ${sc.aiSummary ? `<div class="summary-box"><strong>AI Summary:</strong> ${sc.aiSummary}</div>` : ''}

  <h2>Q&A Review</h2>
  ${(interview.answers || []).map((a, i) => `
    <div class="qa-item">
      <div class="q">Q${i + 1}: ${a.question}</div>
      <div class="a">Answer: ${a.answer || '(No answer provided)'}</div>
      ${a.aiEvaluation ? `<div class="feedback">Score: ${a.aiEvaluation.score}/10 — ${a.aiEvaluation.feedback}</div>` : ''}
    </div>
  `).join('')}
</body>
</html>`;

  const outputDir = path.join('uploads', 'pdfs');
  ensureDir(outputDir);
  const filename = `report-${interview._id}-${Date.now()}.pdf`;
  const outputPath = path.join(outputDir, filename);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  await browser.close();

  return outputPath;
};
