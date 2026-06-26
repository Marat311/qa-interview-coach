import { useState, useRef, useEffect } from 'react'
import './App.css'
import Cat from './Cat'

const CATEGORIES = [
{ id: 'api', label: 'API Testing', icon: '🔌' },
{ id: 'sql', label: 'SQL & Data', icon: '🗄️' },
{ id: 'softskills', label: 'Soft Skills', icon: '💬' },
{ id: 'automation', label: 'Automation', icon: '🤖' },
{ id: 'ui', label: 'UI Testing', icon: '🖥️' },
{ id: 'playwright', label: 'Playwright', icon: '🎭' },
{ id: 'ai', label: 'AI Testing', icon: '🧠' },
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
const recognitionRef = useRef(null)
const textareaRef = useRef(null)
const timerRef = useRef(null)

const questions = generatedQuestions
const currentQuestion = questions[questionIndex]

useEffect(() => {
if (textareaRef.current) {
textareaRef.current.scrollTop = textareaRef.current.scrollHeight
}
}, [textAnswer])

const speak = (text) => {
window.speechSynthesis.cancel()
const doSpeak = () => {
const utterance = new SpeechSynthesisUtterance(text)
const voices = window.speechSynthesis.getVoices()
const preferred = voices.find(v => v.name === 'Samantha') ||
voices.find(v => v.name === 'Karen') ||
voices.find(v => v.name === 'Moira') ||
voices.find(v => v.name.includes('Google US English')) ||
voices.find(v => v.name.includes('Microsoft Aria')) ||
voices.find(v => v.name.includes('Microsoft Jenny')) ||
voices.find(v => v.lang === 'en-US' && !v.name.includes('Google'))
if (preferred) utterance.voice = preferred
utterance.rate = 0.92
utterance.pitch = 1.05
utterance.volume = 1
window.speechSynthesis.speak(utterance)
}
if (window.speechSynthesis.getVoices().length === 0) {
window.speechSynthesis.onvoiceschanged = doSpeak
} else {
doSpeak()
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
const score = text.match(/SCORE:\s*(.+)/)?.[1]?.trim() || ''
const good = text.match(/GOOD:\s*(.+)/)?.[1]?.trim() || ''
const improve = text.match(/IMPROVE:\s*(.+)/)?.[1]?.trim() || ''
const tip = text.match(/TIP:\s*(.+)/)?.[1]?.trim() || ''
const ideal = text.match(/IDEAL:\s*([\s\S]+)/)?.[1]?.trim() || ''
setFeedback({ score, good, improve, tip, ideal })
} catch (error) {
setFeedback({ score: '-', good: 'Error', improve: 'Could not get feedback', tip: 'Check API key', ideal: '' })
}
setIsLoading(false)
}

const nextQuestion = () => {
stopMic()
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
const text = await callAPI(`You are Alex, an experienced Lead SDET interviewer conducting a real job interview.

Job Description: ${jobDescription}
${resume ? `Candidate Resume:\n${resume}` : ''}
Candidate name: ${candidateName || 'Candidate'}
Question number: ${questionNum} of ${mockTotal}

Previous conversation:
${history.map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n\n')}

Ask question #${questionNum}. Be natural, professional, conversational like a real interviewer.
- Start with a brief natural transition
- Ask ONE focused technical question based on the job description ${resume ? 'and candidate resume' : ''}
- If resume is provided, reference specific experience from it occasionally
- Keep it under 3 sentences
- If this is question 1, briefly introduce yourself first`, 300)
setMockQuestion(text.trim())
setIsMockLoading(false)
speak(text.trim())
} catch (error) {
setMockQuestion(`Question ${questionNum}: Tell me about your experience relevant to this role.`)
setIsMockLoading(false)
}
}

const submitMockAnswer = async () => {
if (!textAnswer.trim()) return
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
const text = await callAPI(`You are Alex, a Lead SDET interviewer. You just finished interviewing ${candidateName || 'the candidate'}.

Job Description: ${jobDescription}
${resume ? `Candidate Resume:\n${resume}` : ''}

Full Interview:
${(history || mockHistory).map((h, i) => `Q${i + 1}: ${h.question}\nA: ${h.answer}`).join('\n\n')}

Give a realistic hiring decision. ${resume ? 'Consider how well their resume experience matches their interview answers and the job requirements.' : ''}
Respond in EXACT format:
DECISION: [HIRED / NOT HIRED / STRONG HIRE / NEEDS MORE EXPERIENCE]
SCORE: [X/10]
SUMMARY: [2-3 sentences overall impression]
STRENGTHS: [2-3 bullet points starting with •]
CONCERNS: [2-3 bullet points starting with •]
RECOMMENDATION: [1-2 sentences final recommendation as if writing to hiring manager]`, 1000)
const decision = text.match(/DECISION:\s*(.+)/)?.[1]?.trim() || ''
const score = text.match(/SCORE:\s*(.+)/)?.[1]?.trim() || ''
const summary = text.match(/SUMMARY:\s*([\s\S]+?)(?=STRENGTHS:)/)?.[1]?.trim() || ''
const strengths = text.match(/STRENGTHS:\s*([\s\S]+?)(?=CONCERNS:)/)?.[1]?.trim() || ''
const concerns = text.match(/CONCERNS:\s*([\s\S]+?)(?=RECOMMENDATION:)/)?.[1]?.trim() || ''
const recommendation = text.match(/RECOMMENDATION:\s*([\s\S]+)/)?.[1]?.trim() || ''
setMockFeedback({ decision, score, summary, strengths, concerns, recommendation })
} catch (error) {
setMockFeedback({ decision: 'ERROR', score: '-', summary: 'Could not generate feedback', strengths: '', concerns: '', recommendation: '' })
}
setIsMockLoading(false)
}

return (
<div className="app">

{screen === 'home' && (
<div className="home">
<div className="badge">AI Powered</div>
<h1>QA Interview Coach</h1>
<div className="mode-tabs">
<button className={`mode-tab ${mode === 'practice' ? 'active' : ''}`} onClick={() => setMode('practice')}>
📚 Practice
</button>
<button className={`mode-tab ${mode === 'mock' ? 'active' : ''}`} onClick={() => setMode('mock')}>
🎯 Mock Interview
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
placeholder="Paste the job description here... (requirements, responsibilities, tech stack)"
value={jobDescription}
onChange={(e) => setJobDescription(e.target.value)}
rows={6}
style={{ marginBottom: '16px' }}
/>

<div className="section-label">Your Resume (optional but recommended)</div>
<textarea
className="text-input"
placeholder="Paste your resume here... (experience, skills, projects, achievements — the interviewer will ask questions based on it)"
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
🎯 Start Mock Interview
</button>
<p className="hint">⏱ ~30 minutes · 8 questions · Hiring decision at the end</p>
</>
)}

<p className="hint" style={{ marginTop: '8px' }}>🎤 Use Chrome for voice features</p>
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
<button className="speak-btn" onClick={rephraseQuestion}>🔄 Rephrase</button>
</div>
{rephrasedQuestion && <div className="rephrased">💬 {rephrasedQuestion}</div>}
</div>
<div className="answer-box">
<button className={`mic-btn-large ${isListening ? 'recording' : ''}`} onClick={isListening ? stopMic : startListening}>
{isListening ? '⏹ Stop Recording' : '🎤 Record Answer'}
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
<div className="interviewer-avatar">👨</div>
<div className="interviewer-name">Alex — Lead SDET Interviewer</div>
</div>

<div className="question-card">
{isMockLoading ? (
<div className="loading" style={{ padding: '20px' }}><div className="spinner" />Alex is thinking...</div>
) : (
<p>{mockQuestion}</p>
)}
{mockQuestion && !isMockLoading && (
<button className="speak-btn" onClick={() => speak(mockQuestion)}>🔊 Repeat</button>
)}
</div>

{!isMockLoading && (
<>
<div className="answer-box">
<button className={`mic-btn-large ${isListening ? 'recording' : ''}`} onClick={isListening ? stopMic : startListening}>
{isListening ? '⏹ Stop Recording' : '🎤 Record Answer'}
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
<div className="interviewer-avatar">👨‍💼</div>
<div className="interviewer-name">Alex's Hiring Decision</div>
</div>
{isMockLoading ? (
<div className="loading"><div className="spinner" />Alex is making hiring decision...</div>
) : mockFeedback && (
<>
<div className={`decision-card ${
mockFeedback.decision.includes('STRONG HIRE') ? 'strong-hire' :
mockFeedback.decision.includes('NOT') ? 'not-hired' :
mockFeedback.decision.includes('HIRED') ? 'hired' : 'maybe'
}`}>
<div className="decision-icon">
{mockFeedback.decision.includes('STRONG HIRE') ? '🌟' :
mockFeedback.decision.includes('NOT') ? '❌' :
mockFeedback.decision.includes('HIRED') ? '✅' : '🤔'}
</div>
<div className="decision-text">{mockFeedback.decision}</div>
<div className="decision-score">{mockFeedback.score}</div>
</div>
<div className="feedback-item" style={{ marginBottom: '12px' }}>
<span className="fb-label">📋 Overall Impression</span>
<p>{mockFeedback.summary}</p>
</div>
<div className="feedback-item good" style={{ marginBottom: '12px' }}>
<span className="fb-label">✅ Strengths</span>
<p style={{ whiteSpace: 'pre-line' }}>{mockFeedback.strengths}</p>
</div>
<div className="feedback-item improve" style={{ marginBottom: '12px' }}>
<span className="fb-label">⚠️ Concerns</span>
<p style={{ whiteSpace: 'pre-line' }}>{mockFeedback.concerns}</p>
</div>
<div className="feedback-item tip" style={{ marginBottom: '24px' }}>
<span className="fb-label">📝 Recommendation</span>
<p>{mockFeedback.recommendation}</p>
</div>
<button className="start-btn" onClick={() => {
setScreen('home')
setMockHistory([])
setJobDescription('')
setResume('')
setMockFeedback(null)
}}>
🔄 Try Again
</button>
</>
)}
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
🔄 Practice Again
</button>
</div>
)}

<Cat isActive={isListening} />
</div>
)
}
