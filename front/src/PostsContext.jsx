import React, { createContext, useEffect, useState } from 'react'
import { fetchPosts, createPost, createDB } from '@/api.service'
export const MyContext = createContext()

export default function PostsContext ({ children }) {
  const [posts, setPosts] = useState([])
  useEffect(() => {
    fetchPostsReq()
  }, [])

  const fetchPostsReq = async () => {
    if (localStorage.getItem('database')) {
      const response = await fetchPosts()
      setPosts(response.data)
    }
  }
  const submitPost = async ({ topic, data }) => {
    const response = await createPost({ topic, data })
    alert(response?.message)
    fetchPostsReq()
  }
  const createDBReq = async () => {
    const response = await createDB()
    if (response) {
      localStorage.setItem('database', JSON.stringify(response))
    }
    alert(response?.message)
  }
  return (
    <MyContext.Provider value={{ posts, setPosts, submitPost, createDBReq }}>
      {children}
    </MyContext.Provider>
  )
}
