var express = require('express');
var url = require('url');
var router = express.Router();
const mysql = require('mysql2');

/*
const conn = {  // mysql 접속 설정
  host: '10.39.234.80',
  port: '3306',
  user: 'hm_admin',
  password: 'hM0415!!',
  database: 'tofa_humetro'
};
*/

const conn = {  // mysql 접속 설정
  host: '1.240.13.109',
  port: '3307',
  user: 'tofa1',
  password: '123qwe!@#',
  database: 'tofa_humetro'
};

var connection = mysql.createConnection(conn); // DB 커넥션 생성
connection.connect();   // DB 접속


/* 가입 승인대상 목록 조회 */
router.post('/wait-list', function(req, res, next) {
  //어드민 > 사용자관리 > 가입승인대상 시용자 목록
  var user_wait_list_query = "select\n" +
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

  var jsonBody = req.body;

  var uri = req.url;
  var query = url.parse(uri, true).query;
  var startDate = jsonBody.startDate + " 00:00:00";
  var endDate = jsonBody.endDate + " 23:59:59";


  connection.query(user_wait_list_query, [], function (err, rows, fields) { // testQuery 실행
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
  var user_info_list_query = "select\n" +
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
          user_info_list_query += " and date_format(a.join_date, '%Y-%m-%d %H:%i:%s') like concat('%', ?, '%')\n";
        } else {
          user_info_list_query += " and a." + searchType + " like concat('%', ?, '%')\n";
        }
        params[0] = searchText;
      } else if (searchType == "" && searchText != "") {
        user_info_list_query += " and (\n" +
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
      user_info_list_query += "group by a.account_id, a.username, a.email, a.allowance, a.phone, d.role_name, DATE_FORMAT(join_date, '%Y-%m-%d %H:%i:%s')";

      connection.query(user_info_list_query, params, function (err, rows, fields) { // testQuery 실행
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
  var query = url.parse(uri, true).query;
  var account_id = jsonBody.account_id;

  //어드민 > 사용자관리 > 정보관리 시용자 목록
  var user_info_query = "select \n" +
      "\tconcat(a.account_id,'') as account_id,\n" +
      "\ta.username,\n" +
      "\ta.email,\n" +
      "\ta.dept,\n" +
      "\ta.phone,\n" +
      "\td.role_name,\n" +
      "\tconcat(d.id,'') as role_id,\n" +
      "\tDATE_FORMAT(join_date, '%Y-%m-%d %H:%i:%s') as join_date,\n" +
      "\tgroup_concat(c.resources_id) as resourceCodeList, \n" +
      "\tgroup_concat(c.name ORDER BY c.resources_id ASC) as resourceList \n" +
      "from account a\n" +
      "left outer join account_resource b on a.account_id = b.account_id\n" +
      "left outer join resources c on b.resources_id = c.resources_id\n" +
      "inner join role d on a.id = d.id    \n" +
      "where \n" +
      "\ta.account_id = ?\n" +
      "group by a.account_id, a.username, a.email, a.phone, d.role_name, d.id, DATE_FORMAT(join_date, '%Y-%m-%d %H:%i:%s')";

  connection.query(user_info_query, [account_id], function (err, rows, fields) { // testQuery 실행
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
  var allowance_query = "delete from account where account_id in (?)";
  let listArray = jsonBody.account_ids.split(",");
  connection.beginTransaction();

  connection.query(allowance_query, [listArray], function (err, result, fields) {
    if(err) {
      connection.rollback();
      console.log('query is not excuted. delete fail...\n' + err);
      retJson.result = "500";
      retJson.msg = "query is not excuted. delete fail";
      res.send(retJson);
    } else {
      connection.commit();
      retJson.result = "200";
      retJson.msg = "success";
      res.send(retJson);
    }
  });
});

/* 회원 권한 정보 수정 */
router.post('/member-modification', function(req, res, next) {
  const retJson = {};

  var jsonBody = req.body;
  var uri = req.url;
  var query = url.parse(uri, true).query;
  var account_id = jsonBody.account_id;               //파라미터값 - 계정아이디
  var resourceCodeList = jsonBody.resourceCodeList;   //파라미터값 - 변경할 권한 코드 목록
  
  var del_res_query = "delete from account_resource where account_id = ?"; //권한 삭제 쿼리
  // var ins_res_query = "insert into account_resource(id, account_id, resources_id) values(max(id)+1, ?, ?)"; //권한 추가 쿼리
  var ins_res_query = "insert into account_resource(account_id, resources_id) values ?"; //권한 추가 쿼리

  var arrResourceCodeList = resourceCodeList.split(",");
  var resourceValue = [];

  for(var i=0;i<arrResourceCodeList.length;i++) {
    resourceValue[i] = [account_id, arrResourceCodeList[i]]
  }

  console.log(resourceValue);

  connection.beginTransaction();
  //기존 권한 목록 삭제
  connection.query(del_res_query, [account_id], function (err, result, fields) {
    if(err) {
      connection.rollback();
      console.log('query is not excuted. delete fail...\n' + err);
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
