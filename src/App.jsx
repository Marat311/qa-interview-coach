import { useState, useRef, useEffect } from 'react'
import './App.css'
import KittyCoach from './KittyCoach'

const STORAGE_KEY = 'qa_coach_history'

const saveInterview = (data) => {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const nextHistory = [{ ...data, id: Date.now(), date: new Date().toLocaleDateString() }, ...history]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory.slice(0, 50)))
    return nextHistory.slice(0, 50)
  } catch (e) {
    return []
  }
}

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch (e) { return [] }
}

const CATEGORIES = [
  { id: 'api', label: 'API Testing' },
  { id: 'sql', label: 'SQL & Data' },
  { id: 'softskills', label: 'Soft Skills' },
  { id: 'automation', label: 'Automation' },
  { id: 'ui', label: 'UI Testing' },
  { id: 'playwright', label: 'Playwright' },
  { id: 'ai', label: 'AI Testing' },
]

const LEVELS = [
{ id: 'junior', label: 'Junior', color: '#4ade80' },
{ id: 'mid', label: 'Mid', color: '#facc15' },
{ id: 'lead', label: 'Lead', color: '#f87171' },
]

const TABS = [
{ id: 'score', label: '⭐ Score' },
{ id: 'good', label: '✅ Good' },
{ id: 'improve', label: '💡 Improve' },
{ id: 'tip', label: '🎯 Tip' },
{ id: 'ideal', label: '🏆 Ideal' },
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

const questions = generatedQuestions
const currentQuestion = questions[questionIndex]

useEffect(() => {
if (textareaRef.current) {
textareaRef.current.scrollTop = textareaRef.current.scrollHeight
}
}, [textAnswer])

useEffect(() => {
if (mode === 'history') {
setHistory(loadHistory())
}
}, [mode])

const speak = async (text) => {
if (!text) return
window.speechSynthesis.cancel()

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

const stopSpeech = () => {
window.speechSynthesis.cancel()
if (audioRef.current) {
  audioRef.current.pause()
  audioRef.current.currentTime = 0
  audioRef.current = null
}
}

const stopMic = () => {
if (recognitionRef.current) recognitionRef.current.stop()
setIsListening(false)
}

const startListening = () => {
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
if (!SpeechRecognition) { alert('Please use Chrome browser.'); return }
const recognition = new SpeechRecognition()
recognition.continuous = true
recognition.interimResults = true
recognition.lang = 'en-US'
recognition.onresult = (event) => {
let finalText = ''
let interimText = ''
for (let i = 0; i < event.results.length; i++) {
if (event.results[i].isFinal) finalText += event.results[i][0].transcript + ' '
else interimText += event.results[i][0].transcript
}
setTextAnswer(finalText + interimText)
}
recognition.start()
recognitionRef.current = recognition
setIsListening(true)
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
setScreen('interview')
setQuestionIndex(0)
setTextAnswer('')
setFeedback(null)
setRephrasedQuestion('')
setGeneratedQuestions([])
stopMic()
setIsLoading(true)
try {
const text = await callAPI(`Generate exactly 4 unique, technical interview questions for a ${level}-level ${category} QA/SDET engineer.
Return ONLY a JSON array of 4 strings, no explanations, no markdown, no numbering.
Example: ["Question 1?","Question 2?","Question 3?","Question 4?"]
Make questions specific, technical, and appropriately challenging for ${level} level.
Use this random seed to ensure variety: ${Math.random().toString(36).substring(7)}-${Date.now()}
Never repeat common questions. Focus on real scenarios, edge cases, and problem-solving.`)
const clean = text.replace(/```json|```/g, '').trim()
const parsed = JSON.parse(clean)
setGeneratedQuestions(parsed)
setIsLoading(false)
setTimeout(() => speak(parsed[0]), 500)
} catch (error) {
const fallback = [
`Explain your ${category} testing approach at ${level} level.`,
`What tools do you use for ${category} and why?`,
`Describe a challenging ${category} problem you solved.`,
`How do you ensure quality in ${category} at ${level} level?`,
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
setIsLoading(true)
setActiveTab('score')
setScreen('feedback')
let score = ''
let good = ''
let improve = ''
let tip = ''
let ideal = ''
try {
const text = await callAPI(`You are a senior QA interviewer evaluating a ${level}-level candidate for ${category} skills.
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
  category: CATEGORIES.find(c => c.id === category)?.label,
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

const startMockInterview = async () => {
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
setScreen('mock-feedback')
setIsMockLoading(true)
clearInterval(timerRef.current)
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
const decision = text.match(/DECISION:\s*(.+)/)?.[1]?.trim() || ''
const score = text.match(/SCORE:\s*(.+)/)?.[1]?.trim() || ''
const summary = text.match(/SUMMARY:\s*([\s\S]+?)(?=STRENGTHS:)/)?.[1]?.trim() || ''
const strengths = text.match(/STRENGTHS:\s*([\s\S]+?)(?=CONCERNS:)/)?.[1]?.trim() || ''
const concerns = text.match(/CONCERNS:\s*([\s\S]+?)(?=RECOMMENDATION:)/)?.[1]?.trim() || ''
const recommendation = text.match(/RECOMMENDATION:\s*([\s\S]+)/)?.[1]?.trim() || ''
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
})
setHistory(nextHistory)
}

return (
<div className="app">

{screen === 'home' && (
<div className="home">
<div className="badge">AI Powered</div>
<h1>QA Interview <span className="gradient-word">Coach</span></h1>
<div className="mode-tabs">
  <button className={`mode-tab ${mode === 'practice' ? 'active' : ''}`} onClick={() => setMode('practice')}>
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
<p>Choose your focus area and level to start practicing</p>
<div className="section-label">Category</div>
<div className="grid-2">
{CATEGORIES.map(cat => (
<button key={cat.id} className={`card-btn ${category === cat.id ? 'selected' : ''}`} onClick={() => setCategory(cat.id)}>
<span className="card-icon">{cat.icon}</span>
<span>{cat.label}</span>
</button>
))}
</div>
<div className="section-label">Level</div>
<div className="grid-3">
{LEVELS.map(lvl => (
<button key={lvl.id} className={`level-btn ${level === lvl.id ? 'selected' : ''}`} style={{ '--level-color': lvl.color }} onClick={() => setLevel(lvl.id)}>
{lvl.label}
</button>
))}
</div>
<button className="start-btn" onClick={startInterview} disabled={!category || !level}>
Start Practice →
</button>
</>
)}

{mode === 'mock' && (
<>
<p>Paste a real job description and your resume for a personalized 30-minute mock interview</p>
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
<p className="hint"> ~30 minutes · 8 questions · Hiring decision at the end</p>
</>
)}
<p className="hint" style={{ marginTop: '8px' }}> Use Chrome for voice features</p>
</div>
)}

{screen === 'interview' && (
<div className="interview">
<div className="top-bar">
<button className="back-link" onClick={() => { stopMic(); setScreen('home') }}>← Back</button>
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
<button className="speak-btn" onClick={() => speak(currentQuestion)}>🔊 Repeat</button>
<button className="speak-btn" onClick={rephraseQuestion}>Rephrase</button>
</div>
{rephrasedQuestion && <div className="rephrased">💬 {rephrasedQuestion}</div>}
</div>
<div className="answer-box">
<button className={`mic-btn-large ${isListening ? 'recording' : ''}`} onClick={isListening ? stopMic : startListening}>
{isListening ? 'Stop Recording' : 'Record Answer'}
</button>
<div className="divider">or type your answer</div>
<textarea ref={textareaRef} className="text-input" placeholder="Type your answer here..." value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} rows={5} />
</div>
{textAnswer.trim() && <button className="start-btn" onClick={getFeedback}>Get Feedback →</button>}
</>
)}
</div>
)}

{screen === 'feedback' && (
<div className="feedback-screen">
<div className="top-bar">
<button className="back-link" onClick={() => setScreen('home')}>← Home</button>
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
{activeTab === 'good' && <div className="feedback-item good"><span className="fb-label">✅ What was good</span><p>{feedback.good}</p></div>}
{activeTab === 'improve' && <div className="feedback-item improve"><span className="fb-label">💡 What to improve</span><p>{feedback.improve}</p></div>}
{activeTab === 'tip' && <div className="feedback-item tip"><span className="fb-label">🎯 Actionable tip</span><p>{feedback.tip}</p></div>}
{activeTab === 'ideal' && <div className="feedback-item ideal"><span className="fb-label">🏆 Ideal answer</span><p>{feedback.ideal}</p></div>}
</div>
</>
)}
<div className="controls" style={{ marginTop: '24px' }}>
<button onClick={nextQuestion}>{questionIndex < questions.length - 1 ? 'Next Question →' : 'Finish'}</button>
<button className="secondary" onClick={() => setScreen('home')}>Home</button>
</div>
</div>
)}

{screen === 'mock-interview' && (
<div className="interview">
<div className="top-bar">
<button className="back-link" onClick={() => { clearInterval(timerRef.current); stopMic(); setScreen('home') }}>← Exit</button>
<div style={{
background: timeLeft < 300 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
border: `1px solid ${timeLeft < 300 ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
color: timeLeft < 300 ? '#ef4444' : '#64748b',
padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '700', fontFamily: 'monospace'
}}>⏱ {formatTime(timeLeft)}</div>
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
{mockQuestionNum >= mockTotal ? 'Finish Interview →' : 'Next Question →'}
</button>
)}
</>
)}
</div>
)}

{screen === 'mock-feedback' && (
<div className="feedback-screen">
<div className="top-bar">
<button className="back-link" onClick={() => setScreen('home')}>← Home</button>
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

{mode === 'history' && screen === 'home' && (
  <div style={{ width: '100%', maxWidth: '480px', padding: '0 24px 48px' }}>
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ color: 'var(--snow)', fontSize: '1.2rem', fontWeight: '600', letterSpacing: '-0.02em' }}>Interview History</h2>
        {history.length > 0 && (
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setHistory([]) }}
            style={{ background: 'transparent', border: '1px solid var(--smoke)', color: 'var(--fog)', padding: '5px 12px', borderRadius: '9999px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear
          </button>
        )}
      </div>

      {history.length > 0 && (() => {
        const scores = history.map(h => parseFloat(h.score)).filter(s => !isNaN(s))
        const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-'
        const practices = history.filter(h => h.type === 'practice').length
        const mocks = history.filter(h => h.type === 'mock').length
        const hired = history.filter(h => h.decision?.includes('HIRED') && !h.decision?.includes('NOT')).length
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
            {[
              { label: 'Avg Score', value: avg },
              { label: 'Practice', value: practices },
              { label: 'Mock', value: mocks },
              { label: 'Hired', value: hired },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--carbon)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--snow)', letterSpacing: '-0.03em' }}>{stat.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--fog)', marginTop: '4px', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )
      })()}

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--fog)', fontSize: '14px' }}>
          No interviews yet. Start practicing!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {history.map(item => (
            <div key={item.id} style={{ background: 'var(--carbon)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ background: item.type === 'mock' ? 'rgba(4,40,203,0.15)' : 'rgba(52,252,255,0.1)', border: `1px solid ${item.type === 'mock' ? 'var(--signal)' : 'rgba(52,252,255,0.3)'}`, color: item.type === 'mock' ? '#6b8fff' : 'var(--cyan)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.type === 'mock' ? 'Mock' : 'Practice'}
                  </span>
                  {item.category && <span style={{ color: 'var(--fog)', fontSize: '12px' }}>{item.category}</span>}
                  {item.level && <span style={{ color: 'var(--fog)', fontSize: '12px' }}>· {item.level}</span>}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--fog)', fontFamily: 'IBM Plex Mono, monospace' }}>{item.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: 'var(--ash)', lineHeight: '1.4', flex: 1, marginRight: '12px' }}>
                  {item.question ? item.question.slice(0, 60) + '...' : item.jobDescription}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                  {item.score && item.score !== '-' && (
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--snow)', letterSpacing: '-0.02em' }}>{item.score}</span>
                  )}
                  {item.decision && (
                    <span style={{ fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace', color: item.decision.includes('NOT') ? '#ff9592' : '#3ad389', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {item.decision.replace('STRONG ', '')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

{screen === 'done' && (
<div className="done-screen">
<span className="done-emoji">🏆</span>
<span className="done-stars">⭐⭐⭐</span>
<div className="done-card">
<h1>Well done!</h1>
<p>You completed all {questions.length} questions.<br />Keep practicing to ace your interview!</p>
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
