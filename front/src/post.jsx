import React from 'react'
import PostTitle from '@/postTitle'
import PostData from '@/postData'

export default function post ({ post }) {
  return (
    <div className='bg-white text-black p-5 border mx-3 my-3'>
      <PostTitle title={post.topic} id={post.id} />
      <PostData data={post.data} />
    </div>
  )
}
