import { useState, useEffect } from 'react'
import './KittyCoach.css'

const KittyCoach = ({ expression = 'idle', isRecording = false }) => {
  const [current, setCurrent] = useState(expression)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    if (isRecording) { setCurrent('listening'); return }
    if (current !== expression) {
      setTransitioning(true)
      const t = setTimeout(() => { setCurrent(expression); setTransitioning(false) }, 300)
      return () => clearTimeout(t)
    }
  }, [expression, isRecording])

  const paths = {
    idle: '/assets/kitten/attending.png',
    thinking: '/assets/kitten/thinking.png',
    listening: '/assets/kitten/listening.png',
    encouraging: '/assets/kitten/encouraging.png',
    celebrating: '/assets/kitten/celebration.png',
    happy: '/assets/kitten/happy.png',
  }

  return (
    <div className={`kitty-wrap ${isRecording ? 'recording' : ''}`}>
      <div className={`kitty-img-box ${transitioning ? 'fade' : ''}`}>
        <img
          src={paths[current] || paths.idle}
          alt="QA Coach Cat"
          className="kitty-img"
          onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '🐱' }}
        />
      </div>
      {isRecording && (
        <div className="kitty-dots">
          <span className="dot" />
          <span className="dot" style={{animationDelay:'0.3s'}} />
          <span className="dot" style={{animationDelay:'0.6s'}} />
        </div>
      )}
    </div>
  )
}

export default KittyCoach