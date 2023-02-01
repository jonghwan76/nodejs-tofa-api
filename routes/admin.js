var express = require('express');
var url = require('url');
var router = express.Router();
const mysql = require('mysql2');
const mybatisMapper = require('mybatis-mapper');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('config/dev.properties');

const conn = {  // mysql 접속 설정
  host: properties.get("host"),
  port: properties.get("port"),
  user: properties.get("user"),
  password: properties.get("password"),
  database: properties.get("database")
};

mybatisMapper.createMapper([ 'mapper/admin.xml' ]);
var connection = mysql.createConnection(conn); // DB 커넥션 생성
connection.connect();   // DB 접속

/* 가입 승인대상 목록 조회 */
router.post('/wait-list', function(req, res, next) {

  var jsonBody = req.body;
  var uri = req.url;

  let param = {allowance:0};
  let format = {language: 'sql', indent: ''};
  let query = mybatisMapper.getStatement('adminMapper', 'selectUserList', param, format);

  // console.log(query);

  connection.query(query,function (err, rows, fields) {
    if(err) {
      console.log('query is not excuted. select fail...\n' + err);
      res.send("{}");
    }
    else {
      res.send(rows);
    }
  });
});

/* 가입 승인대상 목록 조회 */
router.post('/info-list', function(req, res, next) {
  var jsonBody = req.body;
  var uri = req.url;
  var searchType = jsonBody.searchType;
  var searchText = jsonBody.searchText;

  let param = {
    allowance:1,
    searchType:searchType,
    searchText:searchText
  };
  let format = {language: 'sql', indent: ''};
  let query = mybatisMapper.getStatement('adminMapper', 'selectUserList', param, format);

  connection.query(query,function (err, rows, fields) {
    if(err) {
      console.log('query is not excuted. select fail...\n' + err);
      res.send("{}");
    }
    else {
      res.send(rows);
    }
  });
});

/* 회원 한명 조회 */
router.post('/member-info', function(req, res, next) {
  var jsonBody = req.body;
  var uri = req.url;
  let param = {account_id:jsonBody.account_id};
  let format = {language: 'sql', indent: ''};
  let query = mybatisMapper.getStatement('adminMapper', 'selectUserInfo', param, format);

  connection.query(query,function (err, rows, fields) {
    if(err) {
      console.log('query is not excuted. select fail...\n' + err);
      res.send("{}");
    }
    else {
      res.send(rows);
    }
  });
});

/* 가입승인 처리 */
router.post('/approval-join', function(req, res, next) {
  const retJson = {};

  var jsonBody = req.body;
  var uri = req.url;
  var query = url.parse(uri, true).query;
  var account_ids = jsonBody.account_ids;

  //어드민 > 사용자관리 > 정보관리 시용자 목록
  var allowance_query = "update account set allowance = 1 where account_id in (?)";
  let listArray = jsonBody.account_ids.split(",");
  connection.beginTransaction();

  connection.query(allowance_query, [listArray], function (err, result, fields) {
    if(err) {
      connection.rollback();
      console.log('query is not excuted. update fail...\n' + err);
      retJson.result = "500";
      retJson.msg = "query is not excuted. update fail";
      res.send(retJson);
    } else {
      connection.commit();
      retJson.result = "200";
      retJson.msg = "success";
      res.send(retJson);
    }
  });
});

/* 가입거절 처리 */
router.post('/removal-account', function(req, res, next) {
  const retJson = {};

  var jsonBody = req.body;
  var uri = req.url;
  var query = url.parse(uri, true).query;
  var account_ids = jsonBody.account_ids;

  //어드민 > 사용자관리 > 정보관리 시용자 목록
  var delete_query1 = "delete from account_resource where account_id in (?)";
  var delete_query2 = "delete from account where account_id in (?)";
  let listArray = account_ids.split(",");
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
          console.log('query is not excuted. delete account fail...\n' + err);
          retJson.result = "500";
          retJson.msg = "query is not excuted. delete account fail";
          res.send(retJson);
        } else {
          connection.commit();
          retJson.result = "200";
          retJson.msg = "success";
          res.send(retJson);
        }
      });
    }
  });


});

/* 회원 권한 정보 수정 */
router.post('/member-modification', function(req, res, next) {
  const retJson = {};
  var jsonBody = req.body;
  var uri = req.url;
  var account_id = jsonBody.account_id;               //파라미터값 - 계정아이디
  var resourceCodeList = jsonBody.resourceCodeList;   //파라미터값 - 변경할 권한 코드 목록
  let param1 = {account_id:account_id};
  let format = {language: 'sql', indent: ''};
  let query1 = mybatisMapper.getStatement('adminMapper', 'deleteResource', param1, format);

  var ins_res_query = "insert into account_resource(account_id, resources_id) values ?"; //권한 추가 쿼리
  var arrResourceCodeList = resourceCodeList.split(",");
  var resourceValue = [];
  for(var i=0;i<arrResourceCodeList.length;i++) {
    resourceValue[i] = [account_id, arrResourceCodeList[i]]
  }

  connection.beginTransaction();

  //기존 권한 목록 삭제
  connection.query(query1,function (err, rows, fields) {
    if(err) {
      connection.rollback();
      console.log('query is not excuted. delete resource fail...\n' + err);
      retJson.result = "500";
      retJson.msg = "query is not excuted. delete fail";
      res.send(retJson);
    } else {
      //권한 추가 쿼리
      var str_query = connection.query(ins_res_query, [resourceValue], function (err, result, fields) {
        if(err) {
          connection.rollback();
          console.log('query is not excuted. insert fail...\n' + err);
          retJson.result = "500";
          retJson.msg = "query is not excuted. insert fail";
          res.send(retJson);
        } else {
          connection.commit();
          retJson.result = "200";
          retJson.msg = "success";
          res.send(retJson);
        }
      });
    }
  });
});

module.exports = router;
