// 建立資料庫連線
const mongo = require("mongodb")
const url = "mongodb+srv://root:z0z0159159@rydercluster.9ooyb5o.mongodb.net/?retryWrites=true"
const client = new mongo.MongoClient(url)
let db = null
client.connect(async function(err){
  if(err){
    console.log('連線失敗',err);
    return
  }
  // 資料庫名稱
  db = client.db('member-system')
  console.log('連線成功');
}) 
// 建立網站伺服器基礎

const express = require('express');
const app = express()
const session =  require('express-session')
app.use(session({
  secret:'anything',
  resave:false,
  saveUninitialized:true,
}))

app.set('view engine', "ejs")
app.set('views','./views')

 // 處理靜態檔案
app.use(express.static('public'))
//處理 post 進來參數
app.use(express.urlencoded({
  extended:true
}))

app.get('/',function(req,res){
  res.render('index.ejs')
})

app.get('/member',async function(req,res){
  // 檢查使用者是否有透過登入程序，進入會員
  if(!req.session.member){
    res.redirect('/')
    // res.render('member.ejs',{ name: name})
    return
  }
  const name = req.session.member.name
  const collection = db.collection('member')
  let result = await collection.find({})
  let data = [];
  await result.forEach((member)=>{
    data.push(member)
  })
  res.render('member.ejs',{ name: name ,data:data })
})

app.get('/error',function(req,res){
  const msg = req.query.msg
  // 一是載入 ejs 二是帶入參數
  res.render('error.ejs',{ msg:msg })
})

app.get('/message',async function(req,res){
   // 檢查使用者是否有透過登入程序，進入會員
  if(!req.session.member){
    res.redirect('/')
    // res.render('member.ejs',{ name: name})
    return
  }
  // 使用者
  const name = req.session.member.name
  const collection = db.collection('member-message')
  const result = await collection.find({})
  let data = [];
  await result.forEach((member)=>{
    data.push(member)
  })
  console.log(result)
  res.render('message.ejs',{ name, data })
})

//註冊會員
app.post('/signup',async function(req,res){
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  // 抓集合資料
  const collection = db.collection('member')
  // 從資料庫抓 email
  let result = await collection.findOne({
    email:email
  })
  // 資料庫有該 email 
  if(result !== null){
    res.redirect('/error?msg=註冊失敗，信箱重複')
    return
  }
  // 將新的會員資料放到資料庫
  result = await collection.insertOne({
    name:name,
    email:email,
    password:password
  })
  console.log(result)
  result.acknowledged ? res.redirect('/message') : console.log('test')
})

// 登入會員
app.post('/signin',async function(req,res){
  const email = req.body.email;
  const password = req.body.password;
  const collection = db.collection('member')
  let result = await collection.findOne({
    $and:[ { email:email}, { password:password } ]
  });
  if(result ===null){
    res.redirect("/error?msg=登入失敗，郵件 or 密碼錯誤")
    return
  }
  // 登入時將會員賽入 session
  req.session.member = result;
  res.redirect('/message')
})

// 登出會員
app.get('/signout',function(req,res){
  // 清空 session
  req.session.member = null
  res.redirect('/')
})

// 檢查 session ，若有回傳登入狀態
app.get('/checkrole',function(req,res){
  // 清空 session
  console.log(req.session)
  req.session.member = null
  res.redirect('/')
})

//送出留言
app.post('/doSubmitMessage',async function(req,res){
  const collection = db.collection('member-message')
  const name = req.session.member.name;
  const time =  new Date().getTime();
  const message = req.body.message;
  let result = await collection.insertOne({
    name,
    time,
    message
  })
  result.acknowledged? res.redirect('/message') :alert('留言失敗，請稍後')
})

app.listen(3000,function(){
  console.log('Serve Started');
})
