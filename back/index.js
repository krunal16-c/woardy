const express = require('express');
const app = express();
const cors = require('cors')
const dbRouter = require('./routes/db');
require('dotenv').config()

app.use(cors())
app.use(express.json());
app.use('/api/db', dbRouter);

const PORT = process.env.PORT || 3333;

app.listen(PORT,()=>{
    console.log('application is running on '+PORT)
})