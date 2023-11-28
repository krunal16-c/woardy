import { Link } from 'react-router-dom'
import React, { useContext } from 'react'
import { MyContext } from '@/PostsContext'

export default function HomePage () { 
  const { createDBReq } = useContext(MyContext)
  return (
    <div className='h-screen'>
      <div className=''>
        <div className=''>
          <button
            onClick={() => { createDBReq() }}
            className='bg-red-500 px-7 py-2 text-white font-bold my-6 mx-6'>
            Create Database
          </button>
        </div>
          
        <div className=''>
          <Link to='/posts'>
            <button className='bg-yellow-500 px-14 py-2 text-white font-bold mx-6'>
              All Posts
            </button>
          </Link>
        </div>
          
        <div className=''>
          <Link to='create'>
            <button className='bg-green-500 px-11 py-2 text-white font-bold my-6 mx-6'>
              Create Post
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
