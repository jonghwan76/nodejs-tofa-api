var express = require('express');
var url = require('url');
var router = express.Router();
var common = require("./common.js");
const mysql = require('mysql2');
const adminMapper = require('mybatis-mapper');
var PropertiesReader = require('properties-reader');
const bcrypt = require("bcrypt");
var properties = PropertiesReader('config/dev.properties');
// var properties = PropertiesReader('config/real.properties');
var requestIp = require('request-ip');

const conn = {  // mysql 접속 설정
  host: properties.get("host"),
  port: properties.get("port"),
  user: properties.get("user"),
  password: properties.get("password"),
  database: properties.get("database")
};

adminMapper.createMapper([ 'mapper/admin.xml' ]);
var connection = mysql.createConnection(conn); // DB 커넥션 생성
connection.connect();   // DB 접속

/* 암호화 테스트 */
router.post('/encTest', function(req, res, next) {
  const PW = 'pass';
  const encryptedPW = bcrypt.hashSync(PW, 10);
  // const same = bcrypt.compareSync(PW, encryptedPW);
  const same = bcrypt.compareSync(PW, "$2a$10$keXZE2lRKHNfVyRkc4d7P.fOj5ktHFIeXDyuLal0V1J5wa.hFDlwK");

  console.log("encryptedPW:" + encryptedPW);
  console.log("same:" + same);
  return res.json({encryptedPW: encryptedPW, same:same});
});

/* 세션 로그인 처리 */
router.post('/login', function(req, res, next) {
  let ip = requestIp.getClientIp(req);
  var jsonBody = req.body;
  // const encryptedPW = "{bcrypt}" + bcrypt.hashSync(jsonBody.password, 10);
  const encryptedPW = bcrypt.hashSync(jsonBody.password, 10);
  let param = {email:jsonBody.userId};
  let format = {language: 'sql', indent: ''};
  let query = adminMapper.getStatement('adminMapper', 'selectLoginInfo', param, format);  //로그인 정보 조회

  // console.log("enc pass:" + encryptedPW);
  // console.log(Math.random().toString(36).slice(2));

  connection.query(query,function (err, rows, fields) {
    if(err) {
      console.log('Faild to login user\n' + err);
      res.send({"result":"500","msg":err});
    } else {
      if(rows.length !=0 && rows[0].password != null) {
        var username = rows[0].username;
        const same = bcrypt.compareSync(jsonBody.password, rows[0].password.replaceAll("{bcrypt}", ""));
        // console.log("same:" + same);
        if (same) {
          connection.beginTransaction();
          var access_key = Math.random().toString(36).slice(2);
          let param1 = {email: param.email, access_key: access_key, client_ip:ip};
          let format = {language: 'sql', indent: ''};
          let query1 = adminMapper.getStatement('adminMapper', 'updateAccountKey', param1, format); //로그인 키 업데이트
          //로그인 인증키 정보 업데이트
          connection.query(query1, function (err, rows, fields) {
            if (err) {
              connection.rollback();
              res.send({"result": "500", "msg": "Login failed."});
            } else {
              connection.commit();
              req.session.userId = jsonBody.userId;
              // req.session.is_logined = true;
              res.send({"result": "200", "msg": "Login success.", "access_key":access_key, "username":username});
            }
          });
        } else {
          // req.session.is_logined = false;
          res.send({"result": "500", "msg": "Login failed."});
        }
      } else {
        // req.session.is_logined = false;
        res.send({"result": "500", "msg": "Faild to login user."});
      }
    }
  });

  // res.send('success login:' + req.session.is_logined);
});

/* 세션 로그아웃 처리 */
router.post('/logout', function(req, res, next) {
  req.session.destroy();  // 내부 sessions 폴터 캐쉬 삭제
  res.send('logout')
});

/* 가입 승인대상 목록 조회 */
router.post('/wait-list', async function(req, res, next) {
  const retJson = {};

  try {
    var jsonBody = req.body;
    let param = {allowance:0};
    let format = {language: 'sql', indent: ''};
    let query = adminMapper.getStatement('adminMapper', 'selectUserList', param, format);

    //로그인 인증키 확인
    if(!await common.auth_check(req, jsonBody.access_key)) {
      retJson.result = "500";
      retJson.msg = "Access Key is not valid.";
      res.send(retJson);
      return;
    }

    connection.query(query,function (err, rows, fields) {
      if(err) {
        console.log('query is not excuted. select fail...\n' + err);
        retJson.result = "550";
        retJson.msg = "query is not excuted. select fail.";
      }
      else {
        retJson.result = "200";
        retJson.msg = "ok";
        retJson.data = rows;
      }
      res.send(retJson);
    });
  } catch(e) {
    retJson.result = "550";
    retJson.msg = e.toString();
    res.send(retJson);
  }
});

/* 정보관리 목록 조회 */
router.get('/info-list', async function(req, res, next) {
  const retJson = {};

  try {
    var jsonBody = req.body;
    var searchType = jsonBody.searchType;
    var searchText = jsonBody.searchText;

    console.log("searchType:" + searchType);
    console.log("searchText:" + searchText);
    console.log("access_key:" + jsonBody.access_key);

    //로그인 인증키 확인
    if(!await common.auth_check(req, jsonBody.access_key)) {
      retJson.result = "500";
      retJson.msg = "Access Key is not valid.";
      res.send(retJson);
      return;
    }

    let param = {
      allowance:1,
      searchType:searchType,
      searchText:searchText
    };
    let format = {language: 'sql', indent: ''};
    let query = adminMapper.getStatement('adminMapper', 'selectUserList', param, format);

    connection.query(query,function (err, rows, fields) {
      if(err) {
        console.log('query is not excuted. select fail...\n' + err);
        retJson.result = "550";
        retJson.msg = "query is not excuted. select fail.";
      }
      else {
        retJson.result = "200";
        retJson.msg = "ok";
        retJson.data = rows;
      }
      res.send(retJson);
    });
  } catch(e) {
    retJson.result = "550";
    retJson.msg = e.toString();
    res.send(retJson);
  }
});

/* 회원 한명 조회 */
router.post('/member-info', async function(req, res, next) {
  const retJson = {};

  try {
    var jsonBody = req.body;
    let param = {account_id:jsonBody.account_id};
    let format = {language: 'sql', indent: ''};
    let query = adminMapper.getStatement('adminMapper', 'selectUserInfo', param, format);

    //로그인 인증키 확인
    if(!await common.auth_check(req, jsonBody.access_key)) {
      retJson.result = "500";
      retJson.msg = "Access Key is not valid.";
      res.send(retJson);
      return;
    }

    connection.query(query,function (err, rows, fields) {
      if(err) {
        console.log('query is not excuted. select fail...\n' + err);
        retJson.result = "550";
        retJson.msg = "query is not excuted. select fail.";
      }
      else {
        retJson.result = "200";
        retJson.msg = "ok";
        retJson.data = rows;
      }
      res.send(retJson);
    });
  } catch(e) {
    retJson.result = "550";
    retJson.msg = e.toString();
    res.send(retJson);
  }
});

/* 가입승인 처리 */
router.post('/approval-join', async function(req, res, next) {
  const retJson = {};

  try {
    const retJson = {};
    var jsonBody = req.body;
    var account_ids = jsonBody.account_ids;

    //로그인 인증키 확인
    if(!await common.auth_check(req, jsonBody.access_key)) {
      retJson.result = "500";
      retJson.msg = "Access Key is not valid.";
      res.send(retJson);
      return;
    }

    //어드민 > 사용자관리 > 정보관리 시용자 목록
    var allowance_query = "update account set allowance = 1 where account_id in (?)";
    let listArray = jsonBody.account_ids.split(",");
    connection.beginTransaction();

    connection.query(allowance_query, [listArray], function (err, result, fields) {
      if(err) {
        connection.rollback();
        console.log('query is not excuted. update fail...\n' + err);
        retJson.result = "550";
        retJson.msg = "query is not excuted. update fail";
      } else {
        connection.commit();
        retJson.result = "200";
        retJson.msg = "ok";
      }
      res.send(retJson);
    });
  } catch(e) {
    connection.rollback();
    retJson.result = "550";
    retJson.msg = e.toString();
    res.send(retJson);
  }
});

/* 가입거절 처리 */
router.post('/removal-account', async function(req, res, next) {
  const retJson = {};
  try {
    var jsonBody = req.body;
    var uri = req.url;
    var query = url.parse(uri, true).query;
    var account_ids = jsonBody.account_ids;

    //어드민 > 사용자관리 > 정보관리 시용자 목록
    var delete_query1 = "delete from account_resource where account_id in (?)";
    var delete_query2 = "delete from account where account_id in (?)";
    let listArray = account_ids.split(",");

    //로그인 인증키 확인
    if(!await common.auth_check(req, jsonBody.access_key)) {
      retJson.result = "500";
      retJson.msg = "Access Key is not valid.";
      res.send(retJson);
      return;
    }

    connection.beginTransaction();
    connection.query(delete_query1, [listArray], function (err, result, fields) {
      if(err) {
        connection.rollback();
        console.log('query is not excuted. delete account_resource fail...\n' + err);
        retJson.result = "500";
        retJson.msg = "query is not excuted. delete account_resource fail";
        res.send(retJson);
      } else {
        connection.query(delete_query2, [listArray], function (err, result, fields) {
          if(err) {
            connection.rollback();
            console.log('query is not excuted. Failed to delete account.\n' + err);
            retJson.result = "550";
            retJson.msg = "query is not excuted. Failed to delete account.";
          } else {
            connection.commit();
            retJson.result = "200";
            retJson.msg = "ok";
          }
          res.send(retJson);
        });
      }
    });
  } catch(e) {
    connection.rollback();
    retJson.result = "550";
    retJson.msg = e.toString();
    res.send(retJson);
  }

});

/* 회원 권한 정보 수정 */
router.post('/member-modification', async function(req, res, next) {
  const retJson = {};
  try {
    var jsonBody = req.body;
    var uri = req.url;
    var account_id = jsonBody.account_id;               //파라미터값 - 계정아이디
    var resourceCodeList = jsonBody.resourceCodeList;   //파라미터값 - 변경할 권한 코드 목록
    var role_id = jsonBody.role; //권한 아이디(ADMIN:19, MANAGER:20, USER:21)
    var user_phone = jsonBody.user_phone; //사용자 전화번호
    var dept = jsonBody.dept; //부서

    let param1 = {account_id:account_id};
    let format = {language: 'sql', indent: ''};
    let query1 = adminMapper.getStatement('adminMapper', 'deleteResource', param1, format);

    var ins_res_query = "insert into account_resource(account_id, resources_id) values ?"; //권한 추가 쿼리
    var update_role_query = "update account set id = ?, phone = ?, dept = ? where account_id = ?"; //Role 및 사용자 전화번호 변경 처리

    var arrResourceCodeList = resourceCodeList.split(",");
    var resourceValue = [];

    // console.log("account_id:" + account_id);
    // console.log("resourceCodeList:" + resourceCodeList);
    // console.log("access_key:" + jsonBody.access_key);

    for(var i=0;i<arrResourceCodeList.length;i++) {
      resourceValue[i] = [account_id, arrResourceCodeList[i]]
    }

    //로그인 인증키 확인
    if(!await common.auth_check(req, jsonBody.access_key)) {
      retJson.result = "500";
      retJson.msg = "Access Key is not valid.";
      res.send(retJson);
      return;
    }

    connection.beginTransaction();

    //기존 권한 목록 삭제
    connection.query(query1,function (err, rows, fields) {
      if(err) {
        connection.rollback();
        console.log('query is not excuted. delete resource fail...\n' + err);
        retJson.result = "550";
        retJson.msg = "query is not excuted. delete fail";
        res.send(retJson);
      } else {

        //권한 추가 쿼리
        var str_query = connection.query(ins_res_query, [resourceValue], function (err, result, fields) {
          if(err) {
            connection.rollback();
            console.log('query is not excuted. insert fail...\n' + err);
            retJson.result = "550";
            retJson.msg = "query is not excuted. insert fail";
            res.send(retJson);
            return;
          } else {

            //권한 변경 및 사용자 전화번호 변경 처리
            connection.query(update_role_query,[role_id, user_phone, dept, account_id], function (err, rows, fields) { // testQuery 실행
              if(err) {
                connection.rollback();
                console.log('query is not excuted. Faild to update.\n' + err);
                retJson.result = "550";
                retJson.msg = "query is not excuted. update fail";
              } else {
                connection.commit();
                retJson.result = "200";
                retJson.msg = "ok";
              }
              res.send(retJson);
            });

          }
        });

      }
    });
  } catch(e) {
    connection.rollback();
    retJson.result = "550";
    retJson.msg = e.toString();
    res.send(retJson);
  }
});

module.exports = router;
