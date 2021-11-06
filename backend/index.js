// Imports.
const Wrapper = require('./classes/Wrapper')
const PlayerSet = require('./classes/PlayerSet')
const path = require('path')
const ip = require('ip')
const express = require('express')

let entered = false
const echo = new Wrapper(null)
const players = new PlayerSet()
const playersQueue = [ ]
const app = express()
app.use(express.json())

echo.changed = () =>
{
  if (echo.value != null)
  {
    const first = playersQueue.shift()

    if (first != null)
    {
      const res = echo.value
      echo.value = null
      res.json(first)
    }
  }
}

players.added = (input) =>
{
  if (echo.value == null)
    playersQueue.push(input)
  else
  {
    const res = echo.value
    echo.value = null
    res.json(input)
  }
}

app.use((req, res, next) =>
{
  if (!req.path.startsWith('/api/'))
    req.url = path.join(req.ip == '::1' ? '/admin' : '/user', req.url)
  else if (req.path != '/api/entry' && !entered)
    req.url = '/status/409'

  next()
})

app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')))
app.use('/user', express.static(path.join(__dirname, '../frontend/user')))
app.get('/admin', (req, res) => res.redirect('/admin.html'))
app.get('/user', (req, res) => res.redirect('/user.html'))
app.all('/status/:code', (req, res) => res.status(parseInt(req.params.code)).end())

app.post('/api/entry', (req, res) =>
{
  if (req.ip == '::1')
    entered = true

  res.json({ ip: ip.address() })
})

app.get('/api/players', (req, res) =>
{
  res.json(players.toObject())
})

app.post('/api/players', (req, res) =>
{
  players.add(req.body)
  res.status(201).end()
})

app.get('/api/players/echo', (req, res) =>
{
  echo.value = res
})

app.listen(8080)
