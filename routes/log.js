var express = require('express');
var url = require('url');
var router = express.Router();
const mysql = require('mysql');

const conn = {  // mysql 접속 설정
  host: '10.39.234.80',
  port: '3306',
  user: 'hm_admin',
  password: 'hM0415!!',
  database: 'tofa_humetro'
};
var connection = mysql.createConnection(conn); // DB 커넥션 생성
connection.connect();   // DB 접속


//어드민 > 로그 > 사용자 접속로그 조회
var user_log_query = "select\n" +
    "            a.dept,\n" +
    "            a.username,\n" +
    "            a.email,\n" +
    "            b.login_ip,\n" +
    "            date_format(b.login_time, '%Y-%m-%d %H:%i:%s') as login_time\n" +
    "        from account a\n" +
    "        inner join account_log b on a.account_id = b.account_id\n" +
    "        where b.login_time between str_to_date(?, '%Y-%m-%d %H:%i:%s')\n" +
    "            and str_to_date(?, '%Y-%m-%d %H:%i:%s')";

//어드민 > 로그 > 사용자 메뉴접속로그
var user_menu_log_query = "select\n" +
    "            a.name,\n" +
    "            date_format(b.menu_time, '%Y-%m-%d %H:%i:%s') as menu_time\n" +
    "        from resources a\n" +
    "        inner join account_menu_log b on a.resources_id = b.menu_id\n" +
    "        where\n" +
    "            b.account_id = ?\n" +
    "            and b.menu_time between str_to_date(?, '%Y-%m-%d %H:%i:%s') and str_to_date(?, '%Y-%m-%d %H:%i:%s')";



/* 사용자 접속로그 조회 */
router.post('/user-log-list', function(req, res, next) {
  const retJson = {};

  var jsonBody = req.body;

  var uri = req.url;
  var query = url.parse(uri, true).query;
  var startDate = jsonBody.startDate + " 00:00:00";
  var endDate = jsonBody.endDate + " 23:59:59";


  connection.query(user_log_query,[startDate, endDate], function (err, rows, fields) { // testQuery 실행
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

/* 사용자 메뉴접속로그 조회 */
router.post('/menu-log-list', function(req, res, next) {
  const retJson = {};

  var jsonBody = req.body;

  var uri = req.url;
  var query = url.parse(uri, true).query;
  var startDate = jsonBody.startDate + " 00:00:00";
  var endDate = jsonBody.endDate + " 23:59:59";
  var account_id = jsonBody.account_id;


  connection.query(user_menu_log_query,[account_id, startDate, endDate], function (err, rows, fields) { // testQuery 실행
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
