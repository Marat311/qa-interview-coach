import { useState, useRef, useEffect } from 'react'
import './App.css'

const QUESTIONS = {
api: {
junior: [
"What is an API and how does it work?",
"What is the difference between GET and POST requests?",
"How do you test a REST API manually?",
"What is a status code 404 and 500?",
],
mid: [
"How do you design an API test strategy?",
"What is the difference between REST and GraphQL testing?",
"How do you handle authentication in API testing?",
"Explain how you would test pagination in an API.",
],
lead: [
"How do you build an API testing framework from scratch?",
"How do you ensure API contract testing in a microservices architecture?",
"How do you integrate API tests into a CI/CD pipeline?",
"How do you measure API test coverage?",
],
},
sql: {
junior: [
"What is the difference between WHERE and HAVING?",
"Explain JOIN types with examples.",
"How do you find duplicate records in a table?",
"What is a primary key vs foreign key?",
],
mid: [
"How do you use SQL to verify data integrity after a feature release?",
"Explain window functions and when you'd use them in QA.",
"How do you write a query to compare two tables?",
"How do you debug a slow query?",
],
lead: [
"How do you design a data validation strategy for a data pipeline?",
"How do you test database migrations?",
"Explain your approach to performance testing at the database level.",
"How do you ensure test data management at scale?",
],
},
softskills: {
junior: [
"Tell me about yourself and your QA experience.",
"How do you handle disagreements with developers about bugs?",
"Describe a time you found a critical bug before release.",
"How do you prioritize your testing tasks?",
],
mid: [
"How do you influence quality culture in a team?",
"Describe how you handle tight deadlines and incomplete requirements.",
"How do you communicate testing progress to stakeholders?",
"Tell me about a time you improved a QA process.",
],
lead: [
"How do you build and mentor a QA team?",
"How do you define a quality strategy for a new product?",
"Describe how you handle conflicts between speed and quality.",
"How do you measure the effectiveness of your QA team?",
],
},
automation: {
junior: [
"What is the difference between manual and automation testing?",
"What frameworks have you used for test automation?",
"How do you decide what to automate?",
"What is a Page Object Model?",
],
mid: [
"How do you structure a large automation test suite?",
"How do you handle flaky tests?",
"Explain your approach to test data management in automation.",
"How do you integrate automation into CI/CD?",
],
lead: [
"How do you choose an automation strategy for a new project?",
"How do you reduce technical debt in a test automation codebase?",
"How do you scale automation across multiple teams?",
"How do you report and track automation ROI?",
],
},
}

const CATEGORIES = [
{ id: 'api', label: 'API Testing', icon: '🔌' },
{ id: 'sql', label: 'SQL & Data', icon: '🗄️' },
{ id: 'softskills', label: 'Soft Skills', icon: '💬' },
{ id: 'automation', label: 'Automation', icon: '🤖' },
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
const [category, setCategory] = useState(null)
const [level, setLevel] = useState(null)
const [questionIndex, setQuestionIndex] = useState(0)
const [isListening, setIsListening] = useState(false)
const [textAnswer, setTextAnswer] = useState('')
const [feedback, setFeedback] = useState(null)
const [isLoading, setIsLoading] = useState(false)
const [activeTab, setActiveTab] = useState('score')
const [rephrasedQuestion, setRephrasedQuestion] = useState('')
const recognitionRef = useRef(null)
const textareaRef = useRef(null)

const questions = category && level ? QUESTIONS[category][level] : []
const currentQuestion = questions[questionIndex]

useEffect(() => {
if (textareaRef.current) {
textareaRef.current.scrollTop = textareaRef.current.scrollHeight
}
}, [textAnswer])

const speak = (text) => {
window.speechSynthesis.cancel()
const utterance = new SpeechSynthesisUtterance(text)
utterance.rate = 0.9
window.speechSynthesis.speak(utterance)
}

const stopMic = () => {
if (recognitionRef.current) recognitionRef.current.stop()
setIsListening(false)
}

const startInterview = () => {
setScreen('interview')
setQuestionIndex(0)
setTextAnswer('')
setFeedback(null)
setRephrasedQuestion('')
stopMic()
setTimeout(() => speak(questions[0]), 500)
}

const startListening = () => {
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
if (!SpeechRecognition) {
alert('Please use Chrome browser.')
return
}
const recognition = new SpeechRecognition()
recognition.continuous = true
recognition.interimResults = true
recognition.lang = 'en-US'
recognition.onresult = (event) => {
let finalText = ''
let interimText = ''
for (let i = 0; i < event.results.length; i++) {
if (event.results[i].isFinal) {
finalText += event.results[i][0].transcript + ' '
} else {
interimText += event.results[i][0].transcript
}
}
setTextAnswer(finalText + interimText)
}
recognition.start()
recognitionRef.current = recognition
setIsListening(true)
}

const rephraseQuestion = async () => {
try {
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
max_tokens: 150,
messages: [{
role: 'user',
content: `Rephrase this interview question in a simpler, clearer way. Just write the rephrased question, nothing else: "${currentQuestion}"`
}]
})
})
const data = await response.json()
const rephrased = data.content[0].text.trim()
setRephrasedQuestion(rephrased)
speak(rephrased)
} catch (error) {
setRephrasedQuestion('Could not rephrase. Check API key.')
}
}

const getFeedback = async () => {
if (!textAnswer.trim()) {
alert('Please write or record your answer first.')
return
}
stopMic()
setIsLoading(true)
setActiveTab('score')
setScreen('feedback')
try {
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
max_tokens: 800,
messages: [{
role: 'user',
content: `You are a senior QA interviewer evaluating a ${level}-level candidate for ${category} skills.
Question: "${currentQuestion}"
Candidate answer: "${textAnswer}"

Respond in this EXACT format:
SCORE: [X/10]
GOOD: [One sentence on what was strong]
IMPROVE: [One sentence on what to improve]
TIP: [One concrete actionable tip]
IDEAL: [Write the ideal answer directly, starting with the key concept. No intro phrases. Just write the answer in 2-3 sentences.]`
}]
})
})
const data = await response.json()
const text = data.content[0].text
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

return (
<div className="app">

{screen === 'home' && (
<div className="home">
<div className="badge">AI Powered</div>
<h1>QA Interview Coach</h1>
<p>Choose your focus area and level to start practicing</p>
<div className="section-label">Category</div>
<div className="grid-2">
{CATEGORIES.map(cat => (
<button
key={cat.id}
className={`card-btn ${category === cat.id ? 'selected' : ''}`}
onClick={() => setCategory(cat.id)}
>
<span className="card-icon">{cat.icon}</span>
<span>{cat.label}</span>
</button>
))}
</div>
<div className="section-label">Level</div>
<div className="grid-3">
{LEVELS.map(lvl => (
<button
key={lvl.id}
className={`level-btn ${level === lvl.id ? 'selected' : ''}`}
style={{ '--level-color': lvl.color }}
onClick={() => setLevel(lvl.id)}
>
{lvl.label}
</button>
))}
</div>
<button className="start-btn" onClick={startInterview} disabled={!category || !level}>
Start Interview →
</button>
<p className="hint">🎤 Use Chrome for voice features</p>
</div>
)}

{screen === 'interview' && (
<div className="interview">
<div className="top-bar">
<button className="back-link" onClick={() => { stopMic(); setScreen('home') }}>← Back</button>
<div className="progress-pill">{questionIndex + 1} / {questions.length}</div>
</div>
<div className="tags">
<span className="tag">{CATEGORIES.find(c => c.id === category)?.label}</span>
<span className="tag">{level}</span>
</div>
<div className="question-card">
<p>{currentQuestion}</p>
<div className="question-btns">
<button className="speak-btn" onClick={() => speak(currentQuestion)}>
🔊 Repeat
</button>
<button className="speak-btn" onClick={rephraseQuestion}>
🔄 Rephrase
</button>
</div>
{rephrasedQuestion && (
<div className="rephrased">
💬 {rephrasedQuestion}
</div>
)}
</div>

<div className="answer-box">
<button
className={`mic-btn-large ${isListening ? 'recording' : ''}`}
onClick={isListening ? stopMic : startListening}
>
{isListening ? '⏹ Stop Recording' : '🎤 Record Answer'}
</button>
<div className="divider">or type your answer</div>
<textarea
ref={textareaRef}
className="text-input"
placeholder="Type your answer here... (voice will also appear here)"
value={textAnswer}
onChange={(e) => setTextAnswer(e.target.value)}
rows={5}
/>
</div>

{textAnswer.trim() && (
<button className="start-btn" onClick={getFeedback}>
Get Feedback →
</button>
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
<div className="loading">
<div className="spinner" />
Analyzing your answer...
</div>
) : feedback && (
<>
<div className="tabs">
{TABS.map(tab => (
<button
key={tab.id}
className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
onClick={() => setActiveTab(tab.id)}
>
{tab.label}
</button>
))}
</div>
<div className="tab-content">
{activeTab === 'score' && (
<div className="score-card">
<div className="score-number">{feedback.score}</div>
<p>Overall score for your answer</p>
</div>
)}
{activeTab === 'good' && (
<div className="feedback-item good">
<span className="fb-label">✅ What was good</span>
<p>{feedback.good}</p>
</div>
)}
{activeTab === 'improve' && (
<div className="feedback-item improve">
<span className="fb-label">💡 What to improve</span>
<p>{feedback.improve}</p>
</div>
)}
{activeTab === 'tip' && (
<div className="feedback-item tip">
<span className="fb-label">🎯 Actionable tip</span>
<p>{feedback.tip}</p>
</div>
)}
{activeTab === 'ideal' && (
<div className="feedback-item ideal">
<span className="fb-label">🏆 Ideal answer</span>
<p>{feedback.ideal}</p>
</div>
)}
</div>
</>
)}

<div className="controls" style={{ marginTop: '24px' }}>
<button onClick={nextQuestion}>
{questionIndex < questions.length - 1 ? 'Next Question →' : 'Finish'}
</button>
<button className="secondary" onClick={() => setScreen('home')}>Home</button>
</div>
</div>
)}

{screen === 'done' && (
<div className="done-screen">
<div className="done-emoji">🏆</div>
<div className="done-stars">⭐⭐⭐</div>
<div className="done-card">
<h1>Well done!</h1>
<p>You completed all {questions.length} questions.<br/>Keep practicing to ace your interview!</p>
</div>
<button className="start-btn" onClick={() => { setScreen('home'); setCategory(null); setLevel(null) }}>
🔄 Practice Again
</button>
</div>
)}

</div>
)
}
