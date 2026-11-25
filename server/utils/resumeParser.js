const fs = require('fs');
const pdfParse = require('pdf-parse');

const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'SQL',
  'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'C++', 'C#', 'Go', 'Rust',
  'Flutter', 'Dart', 'React Native', 'Swift', 'Kotlin', 'HTML', 'CSS', 'Tailwind CSS',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'Linux', 'GraphQL', 'REST API',
  'Socket.io', 'Machine Learning', 'Deep Learning', 'NLP', 'TensorFlow', 'PyTorch', 'Scikit-learn',
  'Data Analysis', 'Pandas', 'NumPy', 'Power BI', 'Tableau', 'Excel', 'Figma', 'UI/UX',
  'GIS', 'GIS Mapping', 'Sustainability', 'Environmental Policy', 'Public Health',
  'Community Organizing', 'Project Management', 'Agile', 'Scrum', 'Leadership',
  'Grant Writing', 'Policy Design', 'Research', 'Communication', 'Public Speaking',
  'Solar Engineering', 'IoT', 'Embedded Systems', 'Cybersecurity', 'Blockchain',
];

async function extractTextFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return (data.text || '').replace(/\r\n/g, '\n').trim();
}

function parseResumeDetails(rawText) {
  const text = (rawText || '').trim();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Extract phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  // Extract LinkedIn & GitHub & Portfolio
  const linkedInMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);

  // Extract skills (case-insensitive boundary match against KNOWN_SKILLS)
  const lower = text.toLowerCase();
  const extractedSkills = KNOWN_SKILLS.filter((skill) => {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(lower);
  });

  // Extract education lines
  const eduKeywords = /(university|college|institute|b\.tech|b\.e\.|b\.sc|m\.tech|m\.sc|bachelor|master|ph\.d|diploma|school)/i;
  const education = [];
  for (const line of lines) {
    if (eduKeywords.test(line) && line.length > 8 && line.length < 140) {
      const yearMatch = line.match(/(19|20)\d{2}(?:\s*[-–]\s*(?:(19|20)\d{2}|present))?/i);
      education.push({
        institution: line.slice(0, 90),
        degree: '',
        field: '',
        year: yearMatch ? yearMatch[0] : '',
      });
      if (education.length >= 3) break;
    }
  }

  // Extract experience lines
  const expKeywords = /(intern|engineer|developer|analyst|coordinator|lead|manager|volunteer|fellow|researcher|designer|consultant)/i;
  const experience = [];
  for (const line of lines) {
    if (expKeywords.test(line) && line.length > 6 && line.length < 120 && !eduKeywords.test(line)) {
      const durMatch = line.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}).{0,25}/i);
      experience.push({
        title: line.slice(0, 80),
        organization: '',
        duration: durMatch ? durMatch[0].slice(0, 30) : '',
        description: '',
      });
      if (experience.length >= 4) break;
    }
  }

  // Extract summary / bio snippet (first substantial descriptive line/paragraph)
  const bioLine = lines.find(
    (l) => l.length >= 55 && l.length <= 320 && !/@/.test(l) && !/linkedin\.com|github\.com/i.test(l)
  ) || '';

  // Suggest headline from top skills or experience
  const suggestedHeadline = experience[0]?.title
    || (extractedSkills.length > 0 ? `${extractedSkills.slice(0, 3).join(' · ')} Specialist` : '');

  return {
    phone,
    linkedIn: linkedInMatch ? linkedInMatch[0] : '',
    github: githubMatch ? githubMatch[0] : '',
    skills: extractedSkills,
    education,
    experience,
    bio: bioLine,
    headline: suggestedHeadline,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}

module.exports = { extractTextFromPdf, parseResumeDetails };
