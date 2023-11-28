import { Link } from 'react-router-dom'
import React from 'react'

export default function AssignmentTitle () {
  return (
    <div className='bg-blue-500 w-full py-4'>
      <div className='mx-6 flex justify-between'>
        <Link to='/'>
          <p className='text-5xl text-white'>CMPT 353 Assignment 4</p>
        </Link>
      </div>
    </div>
  )
}
