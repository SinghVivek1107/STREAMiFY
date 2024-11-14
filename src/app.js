import express from 'express'

const app = express()

const port = 3000

app.get('/', (req,res)=>{
    res.send('Hello World')
})

app.get('/login', (req,res)=>{
    res.send('Enter your credential')
})

app.listen(port, ()=>{
    console.log(`App is listening on port ${port}`);
    
})

export {app}