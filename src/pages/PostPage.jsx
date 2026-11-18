import { useParams } from 'react-router-dom'
import Feed from '../components/Feed.jsx'

export default function PostPage() {
  const { id } = useParams()
  return <Feed postId={id} openComments />
}
