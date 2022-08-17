let router = require('express').Router();


//shop의 중복을 제거하려면 server.js에서 app.use('/shop',require('./routes/shop.js'));이렇게 추가
//눈에 보기 편함 관리가 용이함

//미들웨어를 사용하고 싶다면 추가적용하면된다
//미들웨어 만들기
function 로그인했니 (요청, 응답, next){
  if(요청.user){
    next()
  }else{
    응답.send('로그인 안하셨는뎁숑')
  }
}
router.use(로그인했니);


router.get('/shirts',로그인했니, function(요청, 응답){
  응답.send('셔츠 파는 페이지입니다.');
});

router.get('/pants', function(요청, 응답){
  응답.send('바지 파는 페이지입니다.');
}); 




module.exports =router;