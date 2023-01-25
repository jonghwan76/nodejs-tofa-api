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


//어드민 > 사용자관리 > 가입승인대상 시용자 목록
var user_wait_list = "select\n" +
    "    concat(a.account_id,'') as account_id,\n" +
    "    concat(a.username,'') as username,\n" +
    "    concat(a.email,'') as email,\n" +
    "    case when concat(a.allowance,'') = '1' then '승인' else '신청' end as allowance,\n" +
    "    concat(a.phone,'') as phone,\n" +
    "    concat(d.role_name,'') as role_name,\n" +
    "    ifnull(dept,'') as dept,\n" +
    "    DATE_FORMAT(a.join_date, '%Y-%m-%d %H:%i:%s') as join_date,\n" +
    "    group_concat(c.resources_id) as resourceCodeList,\n" +
    "    group_concat(c.name ORDER BY c.resources_id ASC) as resourceList\n" +
    "from account a\n" +
    "left outer join account_resource b on a.account_id = b.account_id\n" +
    "left outer join resources c on b.resources_id = c.resources_id  and c.resources_id != 35\n" +
    "inner join role d on a.id = d.id\n" +
    "where\n" +
    "    a.allowance <> 1\n" +
    "group by\n" +
    "    a.account_id,\n" +
    "    a.username,\n" +
    "    a.email,\n" +
    "    a.allowance,\n" +
    "    a.phone,\n" +
    "    d.role_name,\n" +
    "    DATE_FORMAT(join_date, '%Y-%m-%d %H:%i:%s')";


/* 가입 승인대상 목록 조회 */
router.post('/wait-list', function(req, res, next) {

  var jsonBody = req.body;

  var uri = req.url;
  var query = url.parse(uri, true).query;
  var startDate = jsonBody.startDate + " 00:00:00";
  var endDate = jsonBody.endDate + " 23:59:59";


  connection.query(user_wait_list,[], function (err, rows, fields) { // testQuery 실행
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
  var query = url.parse(uri, true).query;
  var searchType = jsonBody.searchType;
  var searchText = jsonBody.searchText;
  var params = [];

  console.log("searchType:" + searchType);
  console.log("searchText:" + searchText);

 //어드민 > 사용자관리 > 정보관리 시용자 목록
  var user_info_list = "select\n" +
      "    concat(a.account_id,'') as account_id,\n" +
      "    concat(a.username,'') as username,\n" +
      "    concat(a.email,'') as email,\n" +
      "    case when concat(a.allowance,'') = '1' then '승인' else '신청' end as allowance,\n" +
      "    concat(a.phone,'') as phone,\n" +
      "    concat(d.role_name,'') as role_name,\n" +
      "    ifnull(dept,'') as dept,\n" +
      "    DATE_FORMAT(a.join_date, '%Y-%m-%d %H:%i:%s') as join_date,\n" +
      "    group_concat(c.resources_id) as resourceCodeList,\n" +
      "    group_concat(c.name ORDER BY c.resources_id ASC) as resourceList\n" +
      "from account a\n" +
      "left outer join account_resource b on a.account_id = b.account_id\n" +
      "left outer join resources c on b.resources_id = c.resources_id  and c.resources_id != 35\n" +
      "inner join role d on a.id = d.id\n" +
      "where 1=1\n";

      if(searchType != "") {
        if(searchType == "join_date") {
          user_info_list += " and date_format(a.join_date, '%Y-%m-%d %H:%i:%s') like concat('%', ?, '%')\n";
        } else {
          user_info_list += " and a." + searchType + " like concat('%', ?, '%')\n";
        }
        params[0] = searchText;
      } else if (searchType == "" && searchText != "") {
        user_info_list += " and (\n" +
            "                    a.username like concat('%', ?, '%')\n" +
            "                    or\n" +
            "                    a.email like concat('%', ?, '%')\n" +
            "                    or\n" +
            "                    a.phone like concat('%', ?, '%')\n" +
            "                    or\n" +
            "                    date_format(a.join_date, '%Y-%m-%d %H:%i:%s') like concat('%', ?, '%')\n" +
            "                    or\n" +
            "                    a.dept like concat('%', ?, '%')\n" +
            "                )";
        params[0] = searchText;
        params[1] = searchText;
        params[2] = searchText;
        params[3] = searchText;
        params[4] = searchText;
      }

      user_info_list += "group by\n" +
      "    a.account_id,\n" +
      "    a.username,\n" +
      "    a.email,\n" +
      "    a.allowance,\n" +
      "    a.phone,\n" +
      "    d.role_name,\n" +
      "    DATE_FORMAT(join_date, '%Y-%m-%d %H:%i:%s')";


  connection.query(user_info_list, params, function (err, rows, fields) { // testQuery 실행
    if(err) {
      console.log('query is not excuted. select fail...\n' + err);
      res.send("{}");
    }
    else {
      res.send(rows);
    }
  });
});


module.exports = router;
