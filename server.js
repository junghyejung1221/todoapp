const express = require('express')
const app = express()
const bodyParser= require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

app.use('/public',express.static('public'));

const MongoClient = require('mongodb').MongoClient;



let db;

MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.dfqpooo.mongodb.net/?retryWrites=true&w=majority', function(에러, client){
  if (에러) return console.log(에러)

  db = client.db('todoApp');

  app.listen(8080, function() {
    console.log('mongo connect')
  })
})



app.listen(8000, function() {
    console.log('listening on 8000')
})

//Get 요청 
// 누군가가 경로/pet으로 방문을 하면,,, pet관련 안내문을 띄우기
// app.get('경로',function(요청,응답){});
app.get('/', function(요청, 응답) { 
  응답.render('index.ejs')
});

app.get('/write', function(요청, 응답) { 
    응답.render('write.ejs')
});

// list로 GET요청으로 접속하면
//실제 DB에 저장된 데이터들로 예쁘게 꾸며진 HTML을 보여줌
//먼저 데이터를 꺼내고(find) html 을 보여줘야함
app.get('/list', function(요청, 응답) { 
  db.collection('post').find().toArray(function(에러, 결과){
    응답.render('list.ejs', {posts : 결과})
  });
});

//POST요청
// 어떤 사람이  /add경로로 POST요청을 하면 
// ~을 해주세요
// app.post('경로', function(요청,응답){응답.send('전송완료')})






app.get('/detail/:id', function(요청, 응답) { 
  db.collection('post').findOne({_id: parseInt(요청.params.id)},function(에러,결과){
    
    console.log(결과)
    응답.render('detail.ejs',{data : 결과})
    
    
  })
});

// app.put('/detail',function(요청,응답){
//   // db.collection('post').findOne({_id: parseInt(요청.body._id)},function(에러,결과){
//   //   응답.redirect('/list')
//   // })
//   // console.log( parseInt(요청.body._id))
// });

app.get('/edit/:id', function(요청, 응답) { 
  db.collection('post').findOne({_id: parseInt(요청.params.id)},function(에러,결과){
    if(결과 == null ) 
    {console.log('결과가 없습니다. ')
    응답.send('결과가 없습니다. ')}
    else 
    {console.log(결과)
      응답.render('edit.ejs',{post : 결과})}
  });
});

app.put('/edit',function(요청,응답){
  //PUT요청을 하면 폼에 담긴 제목 데이터, 날짜 데이터를 가지고 업데이트를 해줌
  db.collection('post').updateOne({_id : parseInt(요청.body.id)},{$set : {제목: 요청.body.title, 날짜: 요청.body.date}},function(에러,결과){
    console.log('수정완료')
    응답.redirect('/list')
  })
})

//passport npm install passport passport-local express-session
// const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;
// const session = require('express-session');
//미들웨어를 사용 모든 요청과 응답사이에 사용한다.
// app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
// app.use(passport.initialize());
// app.use(passport.session()); 

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());



app.get('/login',function(요청,응답){
  응답.render('login.ejs')
})

// app.post('/login', 검사하세요, function(요청,응답){

// })
app.post('/login', passport.authenticate('local',{
  failureRedirect : '/fail'
}) , function(요청,응답){
  응답.redirect('/mypage')
});

app.get('/fail',function(요청,응답){
  응답.render('fail.ejs')
})

app.get('/mypage',로그인했니,function(요청,응답){
  응답.render('mypage.ejs',{사용자: 요청.user})
  console.log(요청.user)
})

//db검색 빠르게 해주기
app.get('/search',function(요청,응답){
  let 검색조건 = [
    {
      $search: {
        index: 'title',
        text: {
          query: 요청.query.value,
          path: ['제목', '날짜']  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }
    },
    { $sort: {_id :1}}
  ] 
  //indexing사용
   db.collection('post').aggregate(검색조건).toArray(
    (에러,결과)=>{
      console.log(결과)
  응답.render('search.ejs',{posts : 결과})
  })
})


//미들웨어 만들기
function 로그인했니 (요청, 응답, next){
  if(요청.user){
    next()
  }else{
    응답.send('로그인 안하셨는뎁숑')
  }
}


passport.use(new LocalStrategy({
  usernameField: 'id',  //login.js의  form name: id 값 정의 
  passwordField: 'pw',  //login.js의  form name: pw 값 정의 
  session: true,
  passReqToCallback: false,    //true로 할 경우 id, pw외에 다른것도 검증 가능 밑에 function에 req.body 로 검사 가능
}, function (입력한아이디, 입력한비번, done) {
  console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

passport.serializeUser(function(user,done){
  done(null, user.id)
});

//session에는 user.id만 저장 유저의 여러가지 정보를 찾을 때 실행
passport.deserializeUser(function(아이디,done){
  //디비에서 user.id로 유저를 찾은 뒤에 유저 정보를 뱉어내기
  // done(null,{요기에 넣음})
  db.collection('login').findOne({id: 아이디},function(에러,결과){
    done(null,결과) //mypage에서 요청.user로 사용 가능
  })
})

//회원가입
app.post('/register', function(요청,응답){
  db.collection('login').findOne({id: 요청.body.id},function(에러,결과){
    console.log(결과)
    if (결과 == null) {
      console.log('아이디 만듬')
      db.collection('login').insertOne({id: 요청.body.id , pw: 요청.body.pw},function(에러,결과){
        응답.redirect('/login')
      })
    }else{
      console.log('아이디 이미 있슴')
    }
  })


});


app.post('/add', function(요청, 응답){
  응답.render('write.ejs')
  db.collection('counter').findOne({name : '게시물갯수'},function(에러,결과){
    let 총게시물갯수 = 결과.totalPost;
    let 저장할거 = {_id : 총게시물갯수 + 1 , 작성자: 요청.user._id,제목 : 요청.body.title, 날짜 : 요청.body.date} ;

    db.collection('post').insertOne(저장할거,function(에러,결과){
      console.log('저장완료')
      //counter라는 콜렉션에 있는 totalPost를 1 증가시키는 업데이트(수정)
      db.collection('counter').updateOne({name : '게시물갯수'},{$inc : {totalPost:1}}, function(에러,결과){

      })
    })

    
  })
  
  
});

app.delete('/delete', function(요청, 응답){
  // DB에서 글 삭제해주쇼
  요청.body._id = parseInt(요청.body._id) 

  let 삭제할데이터 = {_id:요청.body._id,작성자: 요청.user.작성자}
  console.log(삭제할데이터)


    db.collection('post').deleteOne(삭제할데이터,function(에러,결과){
      if(에러){console.log(에러)}
      console.log(결과)
      // 응답.redirect('/list')
      응답.send('삭제완료')
  
    })
});


//내 라우터 사용하기
app.use('/shop',require('./routes/shop.js')); //여기서 미들웨어를 사용하고 싶다면shop.js에 미들웨어를 추가한다
app.use('/board/sub',require('./routes/board.js'));