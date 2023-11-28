import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AssignmentTitle from '@/assignment_title'
import PostsContext from '@/PostsContext'
import CreatePost from '@/CreatePost'
import HomePage from '@/home_page'
import AllPosts from '@/AllPosts'
import '@/App.css'

function App () {
  return (
    <div className='App'>
      <PostsContext>
        <BrowserRouter>
          <AssignmentTitle></AssignmentTitle>
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/create' element={<CreatePost />} />
            <Route path='/posts' element={<AllPosts />} />
          </Routes>
        </BrowserRouter>
      </PostsContext>
    </div>
  )
}

export default App
