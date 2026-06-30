import { useState, useRef, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'qa_coach_history'

const saveInterview = (data) => {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const normalizedType = String(data.type || '').toLowerCase()
    const nextHistory = [{ ...data, type: normalizedType, id: Date.now(), date: new Date().toLocaleDateString() }, ...history]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory.slice(0, 50)))
    return nextHistory.slice(0, 50)
  } catch (e) {
    return []
  }
}

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').map(item => ({
      ...item,
      type: String(item.type || '').toLowerCase().trim(),
    }))
  } catch (e) { return [] }
}

const CATEGORIES = [
  {
    id: 'fundamentals',
    label: 'Testing Fundamentals',
    subcategories: [
      { id: 'test-design', label: 'Test Design' },
      { id: 'bug-reporting', label: 'Bug Reporting' },
      { id: 'test-planning', label: 'Test Planning' },
    ],
  },
  {
    id: 'automation',
    label: 'Automation Engineering',
    subcategories: [
      { id: 'selenium', label: 'Selenium' },
      { id: 'playwright', label: 'Playwright' },
      { id: 'cypress', label: 'Cypress' },
      { id: 'appium', label: 'Appium' },
      { id: 'api-automation', label: 'API Automation' },
    ],
  },
  {
    id: 'programming',
    label: 'Programming Languages',
    subcategories: [
      { id: 'python', label: 'Python' },
      { id: 'java', label: 'Java' },
      { id: 'javascript', label: 'JavaScript/TypeScript' },
      { id: 'sql', label: 'SQL' },
    ],
  },
  {
    id: 'api-integration',
    label: 'API & Integration',
    subcategories: [
      { id: 'rest-api', label: 'REST API' },
      { id: 'graphql', label: 'GraphQL' },
      { id: 'contract-testing', label: 'Contract Testing' },
      { id: 'microservices', label: 'Microservices' },
    ],
  },
  {
    id: 'performance',
    label: 'Performance & Security',
    subcategories: [
      { id: 'load-testing', label: 'Load Testing' },
      { id: 'security-testing', label: 'Security Testing' },
      { id: 'accessibility', label: 'Accessibility' },
    ],
  },
  {
    id: 'devops',
    label: 'DevOps & CI/CD',
    subcategories: [
      { id: 'git', label: 'Git' },
      { id: 'ci-cd', label: 'CI/CD Pipelines' },
      { id: 'docker', label: 'Docker' },
    ],
  },
  {
    id: 'ai-data',
    label: 'AI & Data Testing',
    subcategories: [
      { id: 'ai-testing', label: 'AI Testing' },
      { id: 'data-quality', label: 'Data Quality' },
      { id: 'ml-model-testing', label: 'ML Model Testing' },
    ],
  },
  {
    id: 'professional',
    label: 'Professional Skills',
    subcategories: [
      { id: 'agile-scrum', label: 'Agile/Scrum' },
      { id: 'leadership', label: 'Leadership' },
      { id: 'system-design', label: 'System Design for QA' },
    ],
  },
]

const LEVELS = [
  { id: 'junior', label: 'Junior', color: '#4ade80' },
  { id: 'mid', label: 'Mid', color: '#facc15' },
  { id: 'senior', label: 'Senior', color: '#60a5fa' },
  { id: 'lead', label: 'Lead', color: '#f87171' },
  { id: 'manager', label: 'Manager', color: '#8b5cf6' },
]

const TABS = [
{ id: 'score', label: 'Score' },
{ id: 'good', label: 'Good' },
{ id: 'improve', label: 'Improve' },
{ id: 'tip', label: 'Tip' },
{ id: 'ideal', label: 'Ideal' },
]

const MOCK_DECISION_TABS = [
{ id: 'decision', label: 'Decision' },
{ id: 'summary', label: 'Summary' },
{ id: 'strengths', label: 'Strengths' },
{ id: 'concerns', label: 'Concerns' },
{ id: 'recommendation', label: 'Recommendation' },
]

export default function App() {
const [screen, setScreen] = useState('home')
const [mode, setMode] = useState('practice')
const [category, setCategory] = useState(null)
const [subcategory, setSubcategory] = useState(null)
const [selectionStep, setSelectionStep] = useState('category')
const [level, setLevel] = useState(null)
const [questionIndex, setQuestionIndex] = useState(0)
const [isListening, setIsListening] = useState(false)
const [textAnswer, setTextAnswer] = useState('')
const [feedback, setFeedback] = useState(null)
const [isLoading, setIsLoading] = useState(false)
const [activeTab, setActiveTab] = useState('score')
const [mockFeedbackTab, setMockFeedbackTab] = useState('decision')
const [rephrasedQuestion, setRephrasedQuestion] = useState('')
const [generatedQuestions, setGeneratedQuestions] = useState([])
const [jobDescription, setJobDescription] = useState('')
const [resume, setResume] = useState('')
const [candidateName, setCandidateName] = useState('')
const [mockHistory, setMockHistory] = useState([])
const [mockQuestion, setMockQuestion] = useState('')
const [mockQuestionNum, setMockQuestionNum] = useState(0)
const [mockTotal] = useState(8)
const [mockFeedback, setMockFeedback] = useState(null)
const [isMockLoading, setIsMockLoading] = useState(false)
const [timeLeft, setTimeLeft] = useState(30 * 60)
const [historyScreen, setHistoryScreen] = useState(false)
const [history, setHistory] = useState(loadHistory)
const recognitionRef = useRef(null)
const textareaRef = useRef(null)
const timerRef = useRef(null)
const audioRef = useRef(null)

const selectedCategoryObj = CATEGORIES.find(c => c.id === category)
const selectedSubcategoryObj = selectedCategoryObj?.subcategories?.find(s => s.id === subcategory)
const categoryLabel = selectedCategoryObj?.label || ''
const subcategoryLabel = selectedSubcategoryObj?.label || ''
const categoryPath = subcategoryLabel ? `${categoryLabel} / ${subcategoryLabel}` : categoryLabel

const questions = generatedQuestions
const currentQuestion = questions[questionIndex]

useEffect(() => {
  if (!('speechSynthesis' in window)) return
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = null
    }
  }
}, [])

useEffect(() => {
if (textareaRef.current) {
textareaRef.current.scrollTop = textareaRef.current.scrollHeight
}
}, [textAnswer])

useEffect(() => {
if (mode === 'history') {
setHistory(loadHistory())
}
if (mode !== 'mock') {
setJobDescription('')
setResume('')
setCandidateName('')
}
}, [mode])

const speak = async (text) => {
if (!text) return
window.speechSynthesis.cancel()
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices()
}

const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID

console.log('ElevenLabs API Key:', apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING')
console.log('ElevenLabs Voice ID:', voiceId || 'MISSING')

if (apiKey && voiceId) {
try {
const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'xi-api-key': apiKey,
},
body: JSON.stringify({
text,
model_id: 'eleven_turbo_v2_5',
voice_settings: {
stability: 0.5,
similarity_boost: 0.75,
style: 0.3,
use_speaker_boost: true
}
})
})

console.log('ElevenLabs response status:', response.status)

if (response.ok) {
const audioBlob = await response.blob()
const audioUrl = URL.createObjectURL(audioBlob)
const audio = new Audio(audioUrl)
if (audioRef.current) {
  audioRef.current.pause()
  audioRef.current.currentTime = 0
}
audioRef.current = audio
audio.play()
return
} else {
const errorText = await response.text()
console.log('ElevenLabs error:', errorText)
}
} catch (error) {
console.log('ElevenLabs failed:', error)
}
}

// Fallback to browser voice
const doSpeak = () => {
const utterance = new SpeechSynthesisUtterance(text)
const voices = window.speechSynthesis.getVoices()
const preferred =
voices.find(v => v.name === 'Matthew') ||
voices.find(v => v.name ==='Benjamin') ||
voices.find(v => v.lang === 'en-GB') ||
null
if (preferred) utterance.voice = preferred
utterance.rate = 0.88
utterance.pitch = 0.9
utterance.volume = 1
window.speechSynthesis.speak(utterance)
}
if (window.speechSynthesis.getVoices().length === 0) {
window.speechSynthesis.onvoiceschanged = doSpeak
} else {
doSpeak()
}
}

const primeSpeech = () => {
  if (!('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance('Ready')
  utterance.volume = 0
  utterance.rate = 1
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

const stopSpeech = () => {
window.speechSynthesis.cancel()
if (audioRef.current) {
  audioRef.current.pause()
  audioRef.current.currentTime = 0
  audioRef.current = null
}
}

const stopMic = () => {
if (recognitionRef.current) {
  recognitionRef.current.stop()
  recognitionRef.current = null
}
setIsListening(false)
}

const startListening = () => {
stopSpeech()
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
if (!SpeechRecognition) { alert('Please use Chrome browser.'); return }
if (recognitionRef.current) {
  recognitionRef.current.onend = null
  recognitionRef.current.onerror = null
  recognitionRef.current.abort()
  recognitionRef.current = null
}
const recognition = new SpeechRecognition()
recognition.continuous = true
recognition.interimResults = true
recognition.lang = 'en-US'
recognition.maxAlternatives = 1
recognition.onresult = (event) => {
let finalText = ''
let interimText = ''
for (let i = 0; i < event.results.length; i++) {
  if (event.results[i].isFinal) finalText += event.results[i][0].transcript + ' '
  else interimText += event.results[i][0].transcript
}
setTextAnswer(finalText + interimText)
}
recognition.onstart = () => {
  setIsListening(true)
}
recognition.onend = () => {
  setIsListening(false)
  recognitionRef.current = null
}
recognition.onerror = (event) => {
  console.log('Speech recognition error:', event.error || event)
  setIsListening(false)
  recognitionRef.current = null
  if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
    alert('Microphone access was blocked. Please allow microphone permission to record your answer.')
  }
}
try {
  recognition.start()
  recognitionRef.current = recognition
} catch (error) {
  console.log('Speech recognition start failed:', error)
  setIsListening(false)
  alert('Could not start recording. Please try again.')
}
}

const callAPI = async (content, maxTokens = 600) => {
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
'anthropic-version': '2023-06-01',
'anthropic-dangerous-direct-browser-access': 'true',
},
body: JSON.stringify({
model: 'claude-haiku-4-5-20251001',
max_tokens: maxTokens,
messages: [{ role: 'user', content }]
})
})
const data = await response.json()
return data.content[0].text
}

const startInterview = async () => {
primeSpeech()
setScreen('interview')
setQuestionIndex(0)
setTextAnswer('')
setFeedback(null)
setRephrasedQuestion('')
setGeneratedQuestions([])
stopMic()
setIsLoading(true)
try {
const prompt = `Generate exactly 4 unique, technical interview questions for a ${level}-level QA/SDET engineer specializing in ${categoryLabel} and ${subcategoryLabel}.
Return ONLY a JSON array of 4 strings, no explanations, no markdown, no numbering.
Example: ["Question 1?","Question 2?","Question 3?","Question 4?"]
Make questions specific to both the main category ${categoryLabel} and the subcategory ${subcategoryLabel}.
Use this random seed to ensure variety: ${Math.random().toString(36).substring(7)}-${Date.now()}
Never repeat common questions. Focus on real scenarios, edge cases, and problem-solving.`
const text = await callAPI(prompt)
const clean = text.replace(/```json|```/g, '').trim()
const parsed = JSON.parse(clean)
setGeneratedQuestions(parsed)
setIsLoading(false)
setTimeout(() => speak(parsed[0]), 500)
} catch (error) {
const fallback = [
`Explain your ${subcategoryLabel || categoryLabel} testing approach at ${level} level.`,
`What tools do you use for ${subcategoryLabel || categoryLabel} and why?`,
`Describe a challenging ${subcategoryLabel || categoryLabel} problem you solved.`,
`How do you ensure quality in ${subcategoryLabel || categoryLabel} at ${level} level?`,
]
setGeneratedQuestions(fallback)
setIsLoading(false)
setTimeout(() => speak(fallback[0]), 500)
}
}

const rephraseQuestion = async () => {
try {
const text = await callAPI(`Rephrase this interview question in a simpler, clearer way. Just write the rephrased question, nothing else: "${currentQuestion}"`, 150)
setRephrasedQuestion(text.trim())
speak(text.trim())
} catch (error) {
setRephrasedQuestion('Could not rephrase. Check API key.')
}
}

const getFeedback = async () => {
if (!textAnswer.trim()) { alert('Please write or record your answer first.'); return }
stopMic()
stopSpeech()
setIsLoading(true)
setActiveTab('score')
setScreen('feedback')
let score = ''
let good = ''
let improve = ''
let tip = ''
let ideal = ''
try {
const text = await callAPI(`You are a senior QA interviewer evaluating a ${level}-level candidate for ${subcategoryLabel || categoryLabel} skills within ${categoryLabel}.
Question: "${currentQuestion}"
Candidate answer: "${textAnswer}"

Respond in this EXACT format:
SCORE: [X/10]
GOOD: [One sentence on what was strong]
IMPROVE: [One sentence on what to improve]
TIP: [One concrete actionable tip]
IDEAL: [Write the ideal answer directly. No intro phrases. 2-3 sentences.]`, 800)
score = text.match(/SCORE:\s*(.+)/)?.[1]?.trim() || ''
good = text.match(/GOOD:\s*(.+)/)?.[1]?.trim() || ''
improve = text.match(/IMPROVE:\s*(.+)/)?.[1]?.trim() || ''
tip = text.match(/TIP:\s*(.+)/)?.[1]?.trim() || ''
ideal = text.match(/IDEAL:\s*([\s\S]+)/)?.[1]?.trim() || ''
setFeedback({ score, good, improve, tip, ideal })
} catch (error) {
setFeedback({ score: '-', good: 'Error', improve: 'Could not get feedback', tip: 'Check API key', ideal: '' })
}
setIsLoading(false)
saveInterview({
  type: 'practice',
  category: categoryPath,
  level,
  question: currentQuestion,
  score: score || feedback?.score || '-',
})
setHistory(loadHistory())
}

const nextQuestion = () => {
stopMic()
stopSpeech()
setRephrasedQuestion('')
setTextAnswer('')
if (textareaRef.current) {
  textareaRef.current.value = ''
}
setFeedback(null)
if (questionIndex < questions.length - 1) {
const next = questionIndex + 1
setQuestionIndex(next)
setScreen('interview')
setTimeout(() => speak(questions[next]), 500)
} else {
setScreen('done')
}
}

const formatTime = (seconds) => {
const m = Math.floor(seconds / 60).toString().padStart(2, '0')
const s = (seconds % 60).toString().padStart(2, '0')
return `${m}:${s}`
}

const avgScoreClass = (avg) => {
const score = parseFloat(avg)
if (Number.isNaN(score)) return ''
if (score <= 2) return 'avg-low'
if (score <= 5) return 'avg-mid'
if (score <= 7) return 'avg-ok'
return 'avg-high'
}

const startMockInterview = async () => {
primeSpeech()
setScreen('mock-interview')
setMockHistory([])
setMockQuestionNum(1)
setMockQuestion('')
setMockFeedback(null)
setTextAnswer('')
setIsMockLoading(true)
setTimeLeft(30 * 60)
timerRef.current = setInterval(() => {
setTimeLeft(prev => {
if (prev <= 1) { clearInterval(timerRef.current); endMockInterview([]); return 0 }
return prev - 1
})
}, 1000)
await askMockQuestion([], 1)
}

const askMockQuestion = async (history, questionNum) => {
setIsMockLoading(true)
try {
const text = await callAPI(`You are Benjamin, an experienced QA Manager interviewer conducting a real job interview.

Job Description: ${jobDescription}
${resume ? `Candidate Resume:\n${resume}` : ''}
Candidate name: ${candidateName || 'Candidate'}
Question number: ${questionNum} of ${mockTotal}

Previous conversation:
${history.map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n\n')}

${questionNum === 1 ? `This is the START of the interview.
Introduce yourself as Benjamin, QA Manager. Be warm and professional.
Then ask the candidate to introduce themselves.
${resume ? 'You have their resume but want to hear it in their own words first.' : ''}
Keep it natural and welcoming. 2-3 sentences max.`

: questionNum === 2 ? `This is question 2.
${resume ?
`You've read their resume. Now dive deeper - ask them specifically about:
- Their most recent role and daily responsibilities
- A specific project from their resume
Make it feel like you're genuinely curious about their resume experience.`
:
`Ask the candidate to walk you through their current or most recent role and daily responsibilities. Be conversational.`}
Keep it to 2-3 sentences.`

: `This is question ${questionNum} - now ask TECHNICAL questions.
Based on the job description ${resume ? "and candidate's resume" : ""}, ask ONE specific technical question.
Build naturally on what they've shared so far.
Be direct and professional. 2-3 sentences max.
Do NOT repeat any previous questions.`}

IMPORTANT: No markdown, no hashtags, no asterisks. Plain text only.`, 300)

const cleaned = text.trim().replace(/^#+\s*/gm, '').replace(/\*\*/g, '').replace(/\*/g, '')
setMockQuestion(cleaned)
setIsMockLoading(false)
speak(cleaned)
} catch (error) {
const fallback = "Hi! I'm Benjamin, QA Manager here. Thanks for joining today. Could you tell me a bit about yourself and your background in QA?"
setMockQuestion(fallback)
setIsMockLoading(false)
speak(fallback)
}
}

const submitMockAnswer = async () => {
if (!textAnswer.trim()) return
stopSpeech()
stopMic()
const newHistory = [...mockHistory, { question: mockQuestion, answer: textAnswer }]
setMockHistory(newHistory)
setTextAnswer('')
if (mockQuestionNum >= mockTotal) {
clearInterval(timerRef.current)
await endMockInterview(newHistory)
} else {
const next = mockQuestionNum + 1
setMockQuestionNum(next)
await askMockQuestion(newHistory, next)
}
}

const endMockInterview = async (history) => {
stopMic()
stopSpeech()
setScreen('mock-feedback')
setIsMockLoading(true)
clearInterval(timerRef.current)
let decision = ''
let score = ''
let summary = ''
let strengths = ''
let concerns = ''
let recommendation = ''
const parseField = (text, field) => {
  const match = text.match(new RegExp(`${field}:\\s*([\\s\\S]*?)(?=\\n[A-Z ]+:|$)`, 'i'))
  return match?.[1]?.trim().split(/\r?\n/)[0].trim() || ''
}
const normalizeDecision = (value) => {
  if (!value) return ''
  return value.replace(/[.\s]+$/g, '').trim().toUpperCase()
}
try {
const text = await callAPI(`You are Benjamin, a QA Manager interviewer. You just finished interviewing ${candidateName || 'the candidate'}.

Job Description: ${jobDescription}
${resume ? `Candidate Resume:\n${resume}` : ''}

Full Interview:
${(history || mockHistory).map((h, i) => `Q${i + 1}: ${h.question}\nA: ${h.answer}`).join('\n\n')}

Give a realistic hiring decision. Respond in EXACT format:
DECISION: [HIRED / NOT HIRED / STRONG HIRE / NEEDS MORE EXPERIENCE]
SCORE: [X/10]
SUMMARY: [2-3 sentences overall impression]
STRENGTHS: [2-3 bullet points starting with •]
CONCERNS: [2-3 bullet points starting with •]
RECOMMENDATION: [1-2 sentences final recommendation]`, 1000)
decision = normalizeDecision(parseField(text, 'DECISION')) || ''
score = parseField(text, 'SCORE') || ''
summary = text.match(/SUMMARY:\s*([\s\S]+?)(?=STRENGTHS:|$)/i)?.[1]?.trim() || ''
strengths = text.match(/STRENGTHS:\s*([\s\S]+?)(?=CONCERNS:|$)/i)?.[1]?.trim() || ''
concerns = text.match(/CONCERNS:\s*([\s\S]+?)(?=RECOMMENDATION:|$)/i)?.[1]?.trim() || ''
recommendation = text.match(/RECOMMENDATION:\s*([\s\S]+)/i)?.[1]?.trim() || ''
setMockFeedback({ decision, score, summary, strengths, concerns, recommendation })
setMockFeedbackTab('decision')
} catch (error) {
setMockFeedback({ decision: 'ERROR', score: '-', summary: 'Could not generate feedback', strengths: '', concerns: '', recommendation: '' })
setMockFeedbackTab('decision')
}
setIsMockLoading(false)
const nextHistory = saveInterview({
  type: 'mock',
  jobDescription: jobDescription.slice(0, 50) + '...',
  decision: decision || mockFeedback?.decision || '-',
  score: score || mockFeedback?.score || '-',
  summary,
  strengths,
  concerns,
  recommendation,
})
setHistory(nextHistory)
}

return (
<div className="app">

{screen === 'home' && (
<div className="home">
<h1>QA Interview <span className="gradient-word">Coach</span></h1>
<div className="mode-tabs">
  <button className={`mode-tab ${mode === 'practice' ? 'active' : ''}`} onClick={() => { setMode('practice'); setSelectionStep('category'); setCategory(null); setSubcategory(null); setLevel(null) }}>
    Practice
  </button>
  <button className={`mode-tab ${mode === 'mock' ? 'active' : ''}`} onClick={() => setMode('mock')}>
    Mock Interview
  </button>
  <button className={`mode-tab ${mode === 'history' ? 'active' : ''}`} onClick={() => { setMode('history'); setHistory(loadHistory()) }}>
    History
  </button>
</div>

{mode === 'practice' && (
<>
{selectionStep === 'category' && (
<>
<div className="section-label">Main Category</div>
<div className="grid-2">
{CATEGORIES.map(cat => (
<button key={cat.id} className={`card-btn ${category === cat.id ? 'selected' : ''}`} onClick={() => { setCategory(cat.id); setSubcategory(null); setLevel(null); setSelectionStep('subcategory') }}>
<span>{cat.label}</span>
</button>
))}
</div>
</>
)}

{selectionStep === 'subcategory' && selectedCategoryObj && (
<>
<div className="top-bar">
<button className="back-link" onClick={() => { setSelectionStep('category'); setCategory(null); setSubcategory(null); setLevel(null) }}>Back</button>
</div>
<div className="section-label" style={{ marginTop: '10px' }}>Subcategory</div>
<div className="grid-2">
{selectedCategoryObj.subcategories.map(sub => (
<button key={sub.id} className={`card-btn ${subcategory === sub.id ? 'selected' : ''}`} onClick={() => { setSubcategory(sub.id); setLevel(null); setSelectionStep('level') }}>
<span>{sub.label}</span>
</button>
))}
</div>
</>
)}

{selectionStep === 'level' && selectedSubcategoryObj && (
<>
<div className="top-bar">
<button className="back-link" onClick={() => { setSelectionStep('subcategory'); setSubcategory(null); setLevel(null) }}>Back</button>
</div>
<div className="section-label">Level</div>
<div className="grid-3">
{LEVELS.map(lvl => (
<button key={lvl.id} className={`level-btn ${level === lvl.id ? 'selected' : ''}`} style={{ '--level-color': lvl.color }} onClick={() => setLevel(lvl.id)}>
{lvl.label}
</button>
))}
</div>
<button className="start-btn" onClick={startInterview} disabled={!category || !subcategory || !level}>
Start Practice
</button>
</>
)}
</>
)}

{mode === 'mock' && (
<>
<div className="section-label">Job Description *</div>
<textarea
className="text-input jd-input"
placeholder="Paste the job description here..."
value={jobDescription}
onChange={(e) => setJobDescription(e.target.value)}
rows={6}
style={{ marginBottom: '16px' }}
/>
<div className="section-label">Your Resume (optional)</div>
<textarea
className="text-input"
placeholder="Paste your resume here... (the interviewer will ask questions based on it)"
value={resume}
onChange={(e) => setResume(e.target.value)}
rows={5}
style={{ marginBottom: '16px' }}
/>
<div className="section-label">Your Name (optional)</div>
<input
className="name-input"
placeholder="e.g. Marina"
value={candidateName}
onChange={(e) => setCandidateName(e.target.value)}
style={{ marginBottom: '20px' }}
/>
<button className="start-btn" onClick={startMockInterview} disabled={!jobDescription.trim()}>
 Start Mock Interview
</button>
</>
)}


{mode === 'history' && (
  <div className="history-panel">
    <div className="history-header">
      <div>
        <h2>Interview History</h2>
      </div>
      {history.length > 0 && (
        <button className="clear-history-btn" onClick={() => { localStorage.removeItem(STORAGE_KEY); setHistory([]) }}>
          Clear
        </button>
      )}
    </div>

    {history.length > 0 && (() => {
      const scores = history.map(h => parseFloat(h.score)).filter(s => !isNaN(s))
      const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-'
      const practices = history.filter(h => String(h.type || '').toLowerCase() === 'practice').length
      const mocks = history.filter(h => String(h.type || '').toLowerCase() === 'mock').length
      const hired = history.filter(h => {
        const decision = String(h.decision || '').toUpperCase()
        return /\b(STRONG HIRE|HIRED|HIRE)\b/.test(decision) && !/\bNOT\b/.test(decision)
      }).length
      const createClass = (label, value) => {
        if (label === 'Practice' || label === 'Mock') return 'blue-tab'
        if (label === 'Avg Score') return `avg-score ${avgScoreClass(value)}`
        if (label === 'Hired') return value > 0 ? 'hired-score hired-positive' : 'hired-score'
        return ''
      }
      return (
        <div className="history-stats">
          {[
            { label: 'Avg Score', value: avg },
            { label: 'Practice', value: practices },
            { label: 'Mock', value: mocks },
            { label: 'Hired', value: hired },
          ].map(stat => (
            <div key={stat.label} className={`history-stat-card ${createClass(stat.label, stat.value)}`}>
              <div>{stat.value}</div>
              <div>{stat.label}</div>
            </div>
          ))}
        </div>
      )
    })()}

    {history.length === 0 ? (
      <div className="history-empty">No interviews yet. Start practicing!</div>
    ) : (
      <div className="history-list">
        {history.map(item => {
          const scoreValue = parseFloat(item.score)
          const isMockGood = item.type === 'mock' && !isNaN(scoreValue) && scoreValue >= 8
          const decisionText = String(item.decision || '').toUpperCase()
          const isNotHired = /\bNOT\b/.test(decisionText)
          const isHired = /\b(STRONG HIRE|HIRED|HIRE)\b/.test(decisionText) && !isNotHired
          const decisionClass = isNotHired ? 'not-hired' : isHired ? 'hired' : ''

          return (
            <div key={item.id} className={`history-card ${item.type} ${isMockGood ? 'mock-good' : ''} ${isHired ? 'hired' : isNotHired ? 'not-hired' : ''}`}>
              <div className="history-card-top">
                <div className="history-card-labels">
                  <span className={`history-badge ${item.type}`}>{item.type === 'mock' ? 'Mock' : 'Practice'}</span>
                  {item.category && <span className="history-meta">{item.category}</span>}
                  {item.level && <span className="history-meta">· {item.level}</span>}
                </div>
                <span className="history-date">{item.date}</span>
              </div>
              <div className="history-card-body">
                <div className="history-card-copy">
                  {item.type === 'mock' ? `Mock Interview • ${item.jobDescription}` : item.question}
                </div>
                <div className="history-card-score">
                  {item.score && item.score !== '-' && <span className="score-value">{item.score}</span>}
                  {item.decision && <span className={`history-decision ${decisionClass}`}>{item.decision.replace('STRONG ', '')}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
)}
</div>
)}

{screen === 'interview' && (
<div className="interview">
<div className="top-bar">
<button className="back-link" onClick={() => { stopSpeech(); stopMic(); setScreen('home') }}>Back</button>
<div className="progress-pill">{questionIndex + 1} / {questions.length || 4}</div>
</div>
<div className="tags">
<span className="tag">{CATEGORIES.find(c => c.id === category)?.label}</span>
<span className="tag">{level}</span>
</div>
{isLoading && !currentQuestion ? (
<div className="loading"><div className="spinner" />Generating your questions...</div>
) : (
<>
<div className="question-card">
<p>{currentQuestion}</p>
<div className="question-btns">
<button className="speak-btn" onClick={() => speak(currentQuestion)}>Repeat</button>
<button className="speak-btn" onClick={rephraseQuestion}>Rephrase</button>
</div>
{rephrasedQuestion && <div className="rephrased">{rephrasedQuestion}</div>}
</div>
<div className="answer-box">
<button className={`mic-btn-large ${isListening ? 'recording' : ''}`} onClick={isListening ? stopMic : startListening}>
{isListening ? 'Stop Recording' : 'Record Answer'}
</button>
<div className="divider">or type your answer</div>
<textarea ref={textareaRef} className="text-input" placeholder="Type your answer here..." value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} rows={5} />
</div>
{textAnswer.trim() && <button className="start-btn" onClick={getFeedback}>Get Feedback</button>}
</>
)}
</div>
)}

{screen === 'feedback' && (
<div className="feedback-screen">
<div className="top-bar">
<button className="back-link" onClick={() => { stopSpeech(); stopMic(); setScreen('home') }}>Home</button>
<div className="progress-pill">{questionIndex + 1} / {questions.length}</div>
</div>
<div className="question-recap">{currentQuestion}</div>
{isLoading ? (
<div className="loading"><div className="spinner" />Analyzing your answer...</div>
) : feedback && (
<>
<div className="tabs">
{TABS.map(tab => (
<button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
{tab.label}
</button>
))}
</div>
<div className="tab-content">
{activeTab === 'score' && <div className="score-card"><div className="score-number">{feedback.score}</div><p>Overall score for your answer</p></div>}
{activeTab === 'good' && <div className="feedback-item good"><span className="fb-label">What was good</span><p>{feedback.good}</p></div>}
{activeTab === 'improve' && <div className="feedback-item improve"><span className="fb-label">What to improve</span><p>{feedback.improve}</p></div>}
{activeTab === 'tip' && <div className="feedback-item tip"><span className="fb-label">Actionable tip</span><p>{feedback.tip}</p></div>}
{activeTab === 'ideal' && <div className="feedback-item ideal"><span className="fb-label">Ideal answer</span><p>{feedback.ideal}</p></div>}
</div>
</>
)}
<div className="controls" style={{ marginTop: '24px' }}>
<button onClick={nextQuestion}>{questionIndex < questions.length - 1 ? 'Next Question' : 'Finish'}</button>
<button className="secondary" onClick={() => setScreen('home')}>Home</button>
</div>
</div>
)}

{screen === 'mock-interview' && (
<div className="interview">
<div className="top-bar">
<button className="back-link" onClick={() => { clearInterval(timerRef.current); stopSpeech(); stopMic(); setScreen('home') }}>Exit</button>
<div style={{
background: timeLeft < 300 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
border: `1px solid ${timeLeft < 300 ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
color: timeLeft < 300 ? '#ef4444' : '#64748b',
padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '700'
}}>Time: {formatTime(timeLeft)}</div>
<div className="progress-pill">{mockQuestionNum} / {mockTotal}</div>
</div>
<div className="mock-interviewer">
<div className="interviewer-avatar">BV</div>
<div className="interviewer-name">Benjamin — QA Manager Interviewer</div>
</div>
<div className="question-card">
{isMockLoading ? (
<div className="loading" style={{ padding: '20px' }}><div className="spinner" />Benjamin is thinking...</div>
) : (
<p>{mockQuestion}</p>
)}
{mockQuestion && !isMockLoading && (
<button className="speak-btn" onClick={() => speak(mockQuestion)}>Repeat</button>
)}
</div>
{!isMockLoading && (
<>
<div className="answer-box">
<button className={`mic-btn-large ${isListening ? 'recording' : ''}`} onClick={isListening ? stopMic : startListening}>
{isListening ? 'Stop Recording' : 'Record Answer'}
</button>
<div className="divider">or type your answer</div>
<textarea ref={textareaRef} className="text-input" placeholder="Type your answer..." value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} rows={4} />
</div>
{textAnswer.trim() && (
<button className="start-btn" onClick={submitMockAnswer}>
{mockQuestionNum >= mockTotal ? 'Finish Interview' : 'Next Question'}
</button>
)}
</>
)}
</div>
)}

{screen === 'mock-feedback' && (
<div className="feedback-screen">
<div className="top-bar">
<button className="back-link" onClick={() => { stopSpeech(); stopMic(); setScreen('home') }}>Home</button>
</div>
<div className="mock-interviewer" style={{ marginBottom: '20px' }}>
<div className="interviewer-avatar">BV</div>
<div className="interviewer-name">Benjamin's Hiring Decision</div>
</div>
{isMockLoading ? (
<div className="loading"><div className="spinner" />Benjamin is making hiring decision...</div>
) : mockFeedback && (
<>
<div className="tabs" style={{ marginBottom: '18px' }}>
{MOCK_DECISION_TABS.map(tab => (
<button key={tab.id} className={`tab-btn ${mockFeedbackTab === tab.id ? 'active' : ''}`} onClick={() => setMockFeedbackTab(tab.id)}>
{tab.label}
</button>
))}
</div>
<div className="tab-content">
{mockFeedbackTab === 'decision' && (
<div className={`decision-card ${
mockFeedback.decision.includes('STRONG HIRE') ? 'strong-hire' :
mockFeedback.decision.includes('NOT') ? 'not-hired' :
mockFeedback.decision.includes('HIRED') ? 'hired' : 'maybe'
}`}>
<div className="decision-text" style={{ marginBottom: '12px', fontWeight: 700, fontSize: '1rem' }}>{mockFeedback.decision}</div>
<div className="decision-score">{mockFeedback.score}</div>
</div>
)}
{mockFeedbackTab === 'summary' && (
<div className="feedback-item" style={{ marginBottom: '24px' }}>
<span className="fb-label">Overall Impression</span>
<p>{mockFeedback.summary}</p>
</div>
)}
{mockFeedbackTab === 'strengths' && (
<div className="feedback-item good" style={{ marginBottom: '24px' }}>
<span className="fb-label">Strengths</span>
<p style={{ whiteSpace: 'pre-line' }}>{mockFeedback.strengths}</p>
</div>
)}
{mockFeedbackTab === 'concerns' && (
<div className="feedback-item improve" style={{ marginBottom: '24px' }}>
<span className="fb-label">Concerns</span>
<p style={{ whiteSpace: 'pre-line' }}>{mockFeedback.concerns}</p>
</div>
)}
{mockFeedbackTab === 'recommendation' && (
<div className="feedback-item tip" style={{ marginBottom: '24px' }}>
<span className="fb-label">Recommendation</span>
<p>{mockFeedback.recommendation}</p>
</div>
)}
</div>
<button className="start-btn" onClick={() => {
setScreen('home')
setMode('home')
setHistory(loadHistory())
setMockHistory([])
setJobDescription('')
setResume('')
setMockFeedback(null)
}}>
 Try Again
</button>
</>
)}
</div>
)}

{screen === 'done' && (
<div className="done-screen">
<div className="done-card">
<h1>Well done!</h1>
<p>You completed all {questions.length} questions.<br />Keep practicing to improve your interview skills.</p>
</div>
<button className="start-btn" onClick={() => {
setScreen('home')
setCategory(null)
setLevel(null)
setGeneratedQuestions([])
}}>
 Practice Again
</button>
</div>
)}

</div>
)
}
