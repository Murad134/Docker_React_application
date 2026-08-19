import './App.css'

function App() {
  return (
    <div className="app">
      <div className="profile-card">
        <div className="profile-icon">
          M
        </div>

        <h1>Md Murad Hossen</h1>

        <h3>Software Engineer</h3>

        <p>
          Full-stack developer passionate about building scalable,
          modern, and user-friendly web applications.
        </p>

        <div className="skills">
          <span>React</span>
          <span>Node.js</span>
          <span>Docker</span>
          <span>.NET</span>
        </div>

        <button>View Profile</button>
      </div>
    </div>
  )
}

export default App