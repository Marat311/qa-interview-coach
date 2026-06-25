import { useState, useEffect, useRef } from 'react'

export default function Cat({ isActive }) {
const [action, setAction] = useState('sit')
const [pos, setPos] = useState({ x: window.innerWidth - 160, y: window.innerHeight - 160 })
const [flip, setFlip] = useState(false)
const posRef = useRef(pos)
posRef.current = pos

useEffect(() => {
if (isActive) { setAction('excited'); return }
const actions = ['walk', 'walk', 'sit', 'sleep', 'lick', 'purr', 'idle']
const timer = setInterval(() => {
const next = actions[Math.floor(Math.random() * actions.length)]
setAction(next)
if (next === 'walk') {
const newX = 20 + Math.random() * (window.innerWidth - 180)
const newY = 20 + Math.random() * (window.innerHeight - 180)
setFlip(newX < posRef.current.x)
setPos({ x: newX, y: newY })
}
}, 5000)
return () => clearInterval(timer)
}, [isActive])

const isWalking = action === 'walk'
const isSleeping = action === 'sleep'
const isLicking = action === 'lick'
const isPurring = action === 'purr'
const isExcited = isActive || action === 'excited'

return (
<div style={{
position: 'fixed',
left: pos.x,
top: pos.y,
transition: 'left 4.5s cubic-bezier(0.4,0,0.2,1), top 4.5s cubic-bezier(0.4,0,0.2,1)',
zIndex: 9999,
transform: flip ? 'scaleX(-1)' : 'scaleX(1)',
width: 130,
height: 130,
}}>
<svg width="130" height="130" viewBox="0 0 130 130" style={{overflow:'visible'}}>
<defs>
<radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
<stop offset="0%" stopColor="#ffcb8a"/>
<stop offset="100%" stopColor="#e8914f"/>
</radialGradient>
<radialGradient id="bellyGrad" cx="50%" cy="50%" r="50%">
<stop offset="0%" stopColor="#fff0d9"/>
<stop offset="100%" stopColor="#ffd9a0"/>
</radialGradient>
</defs>

{/* SHADOW */}
<ellipse cx="65" cy="125" rx="28" ry="5" fill="rgba(0,0,0,0.15)"/>

{/* TAIL */}
<g style={{
transformOrigin: '72px 100px',
animation: isWalking ? 'tailWalk 0.5s infinite alternate' :
isPurring ? 'tailPurr 0.8s infinite ease-in-out' :
isExcited ? 'tailExcited 0.3s infinite alternate' :
'tailIdle 2.5s infinite ease-in-out'
}}>
<path d="M 72 100 Q 100 90 105 70 Q 110 50 98 42"
stroke="#e8914f" strokeWidth="9" fill="none"
strokeLinecap="round"/>
<path d="M 72 100 Q 100 90 105 70 Q 110 50 98 42"
stroke="#ffcb8a" strokeWidth="4" fill="none"
strokeLinecap="round"/>
<ellipse cx="96" cy="40" rx="8" ry="6" fill="#e8914f"/>
</g>

{/* BODY */}
<g style={{
animation: isWalking ? 'bodyWalk 0.4s infinite alternate' :
isPurring ? 'bodyPurr 0.25s infinite alternate' :
isExcited ? 'bodyExcited 0.35s infinite alternate' :
isSleeping ? 'bodySleep 3s infinite ease-in-out' :
'bodyIdle 3s infinite ease-in-out'
}}>
{/* MAIN BODY */}
<ellipse cx="60" cy="88" rx="32" ry="26" fill="url(#bodyGrad)"/>
{/* BELLY */}
<ellipse cx="60" cy="92" rx="18" ry="16" fill="url(#bellyGrad)"/>
{/* BODY STRIPES */}
<path d="M 42 78 Q 50 72 58 78" stroke="#d4782a" strokeWidth="2" fill="none" opacity="0.4"/>
<path d="M 45 86 Q 53 80 61 86" stroke="#d4782a" strokeWidth="2" fill="none" opacity="0.3"/>

{/* BACK LEGS */}
<g style={{
animation: isWalking ? 'legBL 0.4s infinite alternate' : 'none',
transformOrigin: '42px 108px'
}}>
<ellipse cx="42" cy="112" rx="11" ry="8" fill="#e8914f"/>
<ellipse cx="42" cy="118" rx="9" ry="5" fill="#d4782a"/>
</g>
<g style={{
animation: isWalking ? 'legBR 0.4s infinite alternate' : 'none',
transformOrigin: '78px 108px'
}}>
<ellipse cx="78" cy="112" rx="11" ry="8" fill="#e8914f"/>
<ellipse cx="78" cy="118" rx="9" ry="5" fill="#d4782a"/>
</g>

{/* HEAD */}
<g style={{
transformOrigin: '60px 58px',
animation: isLicking ? 'headLick 0.6s infinite alternate' :
isSleeping ? 'headSleep 3s infinite ease-in-out' :
isExcited ? 'headExcited 0.4s infinite alternate' :
'headIdle 4s infinite ease-in-out'
}}>
{/* HEAD SHAPE */}
<ellipse cx="60" cy="56" rx="28" ry="26" fill="url(#bodyGrad)"/>

{/* EARS */}
<g>
<polygon points="36,36 28,14 48,30" fill="#e8914f"/>
<polygon points="38,34 32,18 46,30" fill="#ffb8b8"/>
<polygon points="84,36 92,14 72,30" fill="#e8914f"/>
<polygon points="82,34 88,18 74,30" fill="#ffb8b8"/>
</g>

{/* FOREHEAD STRIPE */}
<path d="M 54 34 Q 60 30 66 34" stroke="#d4782a" strokeWidth="2" fill="none" opacity="0.4"/>
<path d="M 56 40 Q 60 36 64 40" stroke="#d4782a" strokeWidth="2" fill="none" opacity="0.3"/>

{/* EYES */}
{isSleeping ? (
<>
<path d="M 46 54 Q 52 50 58 54" stroke="#3d2b1f" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
<path d="M 62 54 Q 68 50 74 54" stroke="#3d2b1f" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
<text x="47" y="48" fontSize="10" fill="#667eea" opacity="0.8">z z</text>
</>
) : isExcited ? (
<>
<ellipse cx="51" cy="54" rx="8" ry="9" fill="#3d2b1f"/>
<ellipse cx="69" cy="54" rx="8" ry="9" fill="#3d2b1f"/>
<circle cx="54" cy="51" r="3" fill="white"/>
<circle cx="72" cy="51" r="3" fill="white"/>
<circle cx="55" cy="52" r="1.5" fill="#667eea"/>
<circle cx="73" cy="52" r="1.5" fill="#667eea"/>
</>
) : (
<>
<ellipse cx="51" cy="54" rx="7" ry="7" fill="#3d2b1f"/>
<ellipse cx="69" cy="54" rx="7" ry="7" fill="#3d2b1f"/>
<circle cx="54" cy="51" r="2.5" fill="white"/>
<circle cx="72" cy="51" r="2.5" fill="white"/>
<circle cx="55" cy="52" r="1" fill="#667eea"/>
<circle cx="73" cy="52" r="1" fill="#667eea"/>
</>
)}

{/* NOSE */}
<path d="M 57 64 L 60 67 L 63 64 Z" fill="#e05c7a"/>
<path d="M 60 67 L 60 70" stroke="#e05c7a" strokeWidth="1.5"/>
<path d="M 54 70 Q 57 74 60 70 Q 63 74 66 70" stroke="#c84b6a" strokeWidth="1.8" fill="none" strokeLinecap="round"/>

{/* WHISKERS */}
<line x1="18" y1="62" x2="50" y2="66" stroke="rgba(80,40,10,0.35)" strokeWidth="1.5"/>
<line x1="18" y1="68" x2="50" y2="68" stroke="rgba(80,40,10,0.35)" strokeWidth="1.5"/>
<line x1="18" y1="74" x2="50" y2="70" stroke="rgba(80,40,10,0.35)" strokeWidth="1.5"/>
<line x1="70" y1="66" x2="102" y2="62" stroke="rgba(80,40,10,0.35)" strokeWidth="1.5"/>
<line x1="70" y1="68" x2="102" y2="68" stroke="rgba(80,40,10,0.35)" strokeWidth="1.5"/>
<line x1="70" y1="70" x2="102" y2="74" stroke="rgba(80,40,10,0.35)" strokeWidth="1.5"/>

{/* LICK TONGUE */}
{isLicking && (
<ellipse cx="60" cy="76" rx="5" ry="7" fill="#ff8fab"
style={{animation: 'tongue 0.5s infinite alternate'}}/>
)}
</g>

{/* FRONT LEGS */}
<g style={{
animation: isWalking ? 'legFL 0.4s infinite alternate' : 'none',
transformOrigin: '46px 108px'
}}>
<rect x="38" y="105" width="16" height="18" rx="8" fill="#e8914f"/>
<ellipse cx="46" cy="122" rx="10" ry="5" fill="#d4782a"/>
</g>
<g style={{
animation: isWalking ? 'legFR 0.4s infinite alternate' : 'none',
transformOrigin: '74px 108px'
}}>
<rect x="66" y="105" width="16" height="18" rx="8" fill="#e8914f"/>
<ellipse cx="74" cy="122" rx="10" ry="5" fill="#d4782a"/>
</g>
</g>

{/* PURR HEARTS */}
{isPurring && (
<>
<text x="90" y="30" fontSize="16" style={{animation: 'floatUp 2s infinite ease-out'}}>💕</text>
<text x="20" y="40" fontSize="12" style={{animation: 'floatUp 2s 1s infinite ease-out'}}>♥</text>
</>
)}
</svg>

<style>{`
@keyframes bodyIdle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes bodyWalk { from{transform:translateY(0) rotate(-3deg)} to{transform:translateY(-5px) rotate(3deg)} }
@keyframes bodyPurr { from{transform:scale(1)} to{transform:scale(1.05)} }
@keyframes bodyExcited { from{transform:translateY(0) rotate(-4deg) scale(1.05)} to{transform:translateY(-10px) rotate(4deg) scale(1.1)} }
@keyframes bodySleep { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(4deg)} }
@keyframes headIdle { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
@keyframes headLick { from{transform:rotate(-18deg) translateY(-4px)} to{transform:rotate(18deg) translateY(4px)} }
@keyframes headSleep { 0%,100%{transform:rotate(-8deg) translateY(6px)} 50%{transform:rotate(8deg) translateY(6px)} }
@keyframes headExcited { from{transform:rotate(-6deg) scale(1.05)} to{transform:rotate(6deg) scale(1.05)} }
@keyframes tailIdle { 0%,100%{transform:rotate(-12deg)} 50%{transform:rotate(12deg)} }
@keyframes tailWalk { from{transform:rotate(-35deg)} to{transform:rotate(35deg)} }
@keyframes tailPurr { 0%,100%{transform:rotate(-45deg)} 50%{transform:rotate(45deg)} }
@keyframes tailExcited { from{transform:rotate(-65deg)} to{transform:rotate(65deg)} }
@keyframes legFL { from{transform:rotate(-25deg)} to{transform:rotate(25deg)} }
@keyframes legFR { from{transform:rotate(25deg)} to{transform:rotate(-25deg)} }
@keyframes legBL { from{transform:rotate(20deg)} to{transform:rotate(-20deg)} }
@keyframes legBR { from{transform:rotate(-20deg)} to{transform:rotate(20deg)} }
@keyframes tongue { from{transform:translateY(0) scaleX(0.9)} to{transform:translateY(4px) scaleX(1.1)} }
@keyframes floatUp { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-30px);opacity:0} }
`}</style>
</div>
)
}
