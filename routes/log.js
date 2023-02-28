var express = require('express');
var url = require('url');
var router = express.Router();
var common = require("./common.js");
const mysql = require('mysql2');
const mybatisMapper = require('mybatis-mapper');
var PropertiesReader = require('properties-reader');
// var properties = PropertiesReader('config/dev.properties');
var properties = PropertiesReader('config/real.properties');
  
const conn = {  // mysql 접속 설정
  host: properties.get("host"),
  port: properties.get("port"),
  user: properties.get("user"),
  password: properties.get("password"),
  database: properties.get("database")
};

mybatisMapper.createMapper([ 'mapper/log.xml' ]);
var connection = mysql.createConnection(conn); // DB 커넥션 생성
connection.connect();   // DB 접속

/* 사용자 접속로그 조회 - MyBatis */
router.post('/user-log-list', async function(req, res, next) {
  const retJson = {};
  var jsonBody = req.body;
  var uri = req.url;

  let param = {
    startDate : jsonBody.startDate + " 00:00:00",
    endDate : jsonBody.endDate + " 23:59:59"
  }

  let format = {language: 'sql', indent: ''};
  let query = mybatisMapper.getStatement('logMapper', 'userlogList', param, format);

  //로그인 인증키 확인
  if(!await common.auth_check(req, jsonBody.access_key)) {
    res.send("{}");
    return;
  }

  connection.query(query,function (err, rows, fields) {
    if(err) {
      console.log('query is not excuted. select fail...\n' + err);
      retJson.list = null;
    } else {
      retJson.list = rows;
      res.send(retJson);
    }

  });
});


/* 사용자 접속로그 조회 - MyBatis */
router.post('/menu-log-list', async function(req, res, next) {
  const retJson = {};
  var jsonBody = req.body;
  var uri = req.url;

  let param = {
    startDate : jsonBody.startDate + " 00:00:00",
    endDate : jsonBody.endDate + " 23:59:59",
    account_id : jsonBody.account_id
  }

  let format = {language: 'sql', indent: ''};
  let query = mybatisMapper.getStatement('logMapper', 'menulogList', param, format);

  //로그인 인증키 확인
  if(!await common.auth_check(req, jsonBody.access_key)) {
    res.send("{}");
    return;
  }

  connection.query(query,function (err, rows, fields) {
    if(err) {
      console.log('query is not excuted. select fail...\n' + err);
      retJson.list = null;
    }
    else {
      retJson.list = rows;
      res.send(retJson);
    }
  });
});

module.exports = router;
