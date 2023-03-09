var express = require('express');
var url = require('url');
var router = express.Router();
var common = require("./common.js");
const mysql = require('mysql2');
const mybatisMapper = require('mybatis-mapper');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('config/dev.properties');
// var properties = PropertiesReader('config/real.properties');

const conn = {  // mysql 접속 설정
  host: properties.get("host"),
  port: properties.get("port"),
  user: properties.get("user"),
  password: properties.get("password"),
  database: properties.get("database")
};

mybatisMapper.createMapper([ 'mapper/stat.xml' ]);
var connection = mysql.createConnection(conn); // DB 커넥션 생성
connection.connect();   // DB 접속

/* 접속사용자 TOP 10 조회 - MyBatis */
router.post('/top10-user', async function(req, res, next) {
  const retJson = {};
  try {
    var uri = req.url;
    var paramURL = url.parse(uri, true).query;

    // var jsonBody = req.body;
    var uri = req.url;

    let param = {
      startDate : paramURL.startDate + " 00:00:00",
      endDate : paramURL.endDate + " 23:59:59",
      dept : paramURL.dept
    }

    let format = {language: 'sql', indent: ''};
    let query = mybatisMapper.getStatement('statMapper', 'selectTop10User', param, format);

    //로그인 인증키 확인
    if(!await common.auth_check(req, paramURL.access_key)) {
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
        retJson.data = null;
      } else {
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

/* 접속부서 TOP 10 조회 - MyBatis */
router.post('/top10-dept', async function(req, res, next) {
  const retJson = {};

  try {
    var uri = req.url;
    var paramURL = url.parse(uri, true).query;
    // var jsonBody = req.body;

    let param = {
      startDate : paramURL.startDate + " 00:00:00",
      endDate : paramURL.endDate + " 23:59:59",
      dept : paramURL.dept
    }

    let format = {language: 'sql', indent: ''};
    let query = mybatisMapper.getStatement('statMapper', 'selectTop10Dept', param, format);

    //로그인 인증키 확인
    if(!await common.auth_check(req, paramURL.access_key)) {
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
        retJson.data = null;
      } else {
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

/* 조회메뉴 TOP 10 조회 - MyBatis */
router.post('/top10-menu', async function(req, res, next) {
  const retJson = {};
  try {
    var uri = req.url;
    var paramURL = url.parse(uri, true).query;
    // var jsonBody = req.body;

    let param = {
      startDate : paramURL.startDate + " 00:00:00",
      endDate : paramURL.endDate + " 23:59:59",
      dept : paramURL.dept
    }

    let format = {language: 'sql', indent: ''};
    let query = mybatisMapper.getStatement('statMapper', 'selectTop10Menu', param, format);

    //로그인 인증키 확인
    if(!await common.auth_check(req, paramURL.access_key)) {
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
        retJson.data = null;
      } else {
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

module.exports = router;
