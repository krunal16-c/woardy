import React from 'react'

export default function postTitle ({ title, id }) {
  return (
    <p className='text-md'>
      ({id}) {title}
    </p>
  )
}
