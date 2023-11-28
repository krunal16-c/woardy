import React, { useContext, useState } from 'react'
import { MyContext } from '@/PostsContext'

export default function CreatePost () {
  const { submitPost } = useContext(MyContext)
  const [topic, setTopic] = useState('')
  const [data, setData] = useState('')
  const createPost = e => {
    e.preventDefault()
    submitPost({ topic, data })
  }
  return (
    <div className='w-1/3 border mx-3 my-3'>
      <form onSubmit={createPost}>
        <h2 className='my-3 mx-3'>Make a new post</h2>
        <div className='flex w-full flex-col'>
          <input
            className='border py-2 mx-3 my-3 px-2'
            type='text'
            name='topic'
            id='topic'
            placeholder='topic'
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
          <textarea
            className='border py-2 mx-3 my-3 px-2'
            name='data'
            id='data'
            rows='5'
            placeholder='content'
            value={data}
            onChange={e => setData(e.target.value)}
          ></textarea>
          <button
            className=' text-start bg-blue-500 px-3 py-2 text-white mx-3 my-3' type='submit'>
            ADD THIS POST (click here)
          </button>
        </div>
      </form>
    </div>
  )
}
