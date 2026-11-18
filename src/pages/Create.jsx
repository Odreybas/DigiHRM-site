import { Link } from 'react-router-dom'

export default function Create() {
  return (
    <>
      <h2>Create</h2>
      <Link to="/product/new" className="card item"><strong>Add a product</strong><span className="muted">List something you sell or supply.</span></Link>
      <Link to="/service/new" className="card item"><strong>Add a service</strong><span className="muted">Offer your skills or trade to people nearby.</span></Link>
      <Link to="/business/new" className="card item"><strong>Add a business</strong><span className="muted">Create a page for your shop or company.</span></Link>
      <Link to="/job/new" className="card item"><strong>Post a job</strong><span className="muted">Hire staff, interns or casual workers.</span></Link>
      <Link to="/post/new" className="card item"><strong>Share a post, photo or video</strong><span className="muted">Show your work, new stock or a vacancy.</span></Link>
    </>
  )
}
