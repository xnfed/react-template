import React from 'react'
import { IndexLink, Link } from 'react-router'
import './Header.scss'

export const Header = () => (
  <div>
    <h1>React Starter Kit</h1>
    <h2><a href='https://bodyno.com' target='_blank'>bodyno</a></h2>
    <IndexLink to='/' activeClassName='route--active'>
      Home
    </IndexLink>
    {' · '}
    <Link to='/counter' activeClassName='route--active'>
      Counter
    </Link>
    {' · '}
    <Link to='/zen' activeClassName='route--active'>
      Zen
    </Link>
    {' · '}
    <Link to='/elapse' activeClassName='route--active'>
      Elapse
    </Link>
    {' · '}
    <Link to='/notFound' activeClassName='route--active'>
      404
    </Link>
  </div>
)

export default Header
