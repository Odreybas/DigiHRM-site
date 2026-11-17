import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

export default function Home() {
  const { user } = useAuth()
  return (
    <section className="hero">
      <h1>Find people, skills and businesses near you.</h1>
      <p>
        Build a profile, list your skills, register your business, and get found by the
        people who need you. One account does it all.
      </p>
      <div className="row">
        <Link className="btn" to="/explore">Explore</Link>
        {user ? (
          <Link className="btn ghost" to="/dashboard">Go to dashboard</Link>
        ) : (
          <Link className="btn ghost" to="/login">Create an account</Link>
        )}
      </div>
    </section>
  )
}
