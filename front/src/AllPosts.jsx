import React, { useContext } from 'react'
import { MyContext } from '@/PostsContext'
import Post from '@/post'

export default function AllPosts () {
  const { posts } = useContext(MyContext)
  return (
    <div className='bg-blue-500 text-white w-1/3 border mx-3 my-3 px-3 py-3'>
      <h2 className=''>Previously added posts</h2>
      {posts && posts.map(item => <Post key={item.id} post={item} />)}
    </div>
  )
}
