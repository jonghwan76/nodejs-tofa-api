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

//테스트 쿼리
var testQuery = "SELECT\n" +
    "            b.train_no_display as trainNo,\n" +
    "            round(sum(mileage_daily) / 1000,1) as daily_sum_mileage,\n" +
    "            round(avg(mileage_daily) / 1000,1) as daily_avg_mileage\n" +
    "        FROM aggr_mileage a\n" +
    "        INNER JOIN train_list b on a.fleet_id = train_no\n" +
    "        WHERE 1=1\n" +
    "        and b.train_no in (?)\n" +
    "        and a.mileage_dt between DATE_FORMAT(?, '%Y-%m-%d %H:%i:%s') and DATE_FORMAT(?, '%Y-%m-%d %H:%i:%s')\n" +
    "        GROUP BY a.fleet_id\n" +
    "        ORDER BY b.order_no asc";

//대시보드 > 고장투데이 > 고장등급별 비중 쿼리
var faultCodePieRate_query = "        SELECT\n" +
    "            round((a_cnt / total_cnt) * 100, 1) as aRate,\n" +
    "            round((b_cnt / total_cnt) * 100, 1) as bRate,\n" +
    "            round((c_cnt / total_cnt) * 100, 1) as cRate,\n" +
    "            round((d_cnt / total_cnt) * 100, 1) as dRate,\n" +
    "            round((w_cnt / total_cnt) * 100, 1) as wRate\n" +
    "        FROM\n" +
    "            (\n" +
    "                SELECT\n" +
    "                    ifnull(sum(case when b.level = 'A' then 1 end) ,0) as a_cnt,\n" +
    "                    ifnull(sum(case when b.level = 'B' then 1 end) ,0) as b_cnt,\n" +
    "                    ifnull(sum(case when b.level = 'C' then 1 end) ,0) as c_cnt,\n" +
    "                    ifnull(sum(case when b.level = 'D' then 1 end) ,0) as d_cnt,\n" +
    "                    ifnull(sum(case when b.level = 'W' then 1 end) ,0) as w_cnt,\n" +
    "                    count(*) as total_cnt\n" +
    "                FROM fault_history a\n" +
    "                INNER JOIN fault_info b on a.mfds = b.fault_no and a.protocol_type = b.protocol_type\n" +
    "                WHERE fleet_id = ?\n" +
    "                  and a.detect_time between DATE_FORMAT(?, '%Y-%m-%d %H:%i:%s')  and DATE_FORMAT(?, '%Y-%m-%d %H:%i:%s')\n" +
    "            ) XA;";

//진단 > 편성진단 > DCU 데이터 현황 차트
var getDcuChart_query = "        SELECT\n" +
    "            STR_TO_DATE(stat_dt, '%Y-%m-%d') as signal_date,\n" +
    "            round(AVG(open_time),2) AS avg_open_time,\n" +
    "            round(AVG(close_time),2) AS avg_close_time,\n" +
    "            round(AVG(start_time),2) AS avg_start_time\n" +
    "        FROM stat_dcu_new\n" +
    "        WHERE 1=1\n" +
    "                AND FLEET_ID in (?)\n" +
    "                AND door_pos = ?\n" +
    "                AND stat_dt between DATE_FORMAT(?, '%Y-%m-%d %H:%i:%s') AND DATE_FORMAT(?, '%Y-%m-%d %H:%i:%s')\n" +
    "                AND (start_time <= 10 and close_time <= 10)\n" +
    "        GROUP BY STR_TO_DATE(stat_dt, '%Y-%m-%d')";

//진단 > 편성진단 > DCU 데이터 현황 차트 > ALL
var getDcuChartAll_query = "SELECT\n" +
    "            STR_TO_DATE(stat_dt, '%Y-%m-%d') as signal_date,\n" +
    "            round(AVG(open_time),2) AS all_open_time,\n" +
    "            round(AVG(close_time),2) AS all_close_time,\n" +
    "            round(AVG(start_time),2) AS all_start_time\n" +
    "        FROM stat_dcu_new\n" +
    "        WHERE\n" +
    "            stat_dt between DATE_FORMAT(?, '%Y-%m-%d %H:%i:%s') AND DATE_FORMAT(?, '%Y-%m-%d %H:%i:%s')\n" +
    "            AND (start_time <= 10 and close_time <= 10)\n" +
    "        GROUP BY STR_TO_DATE(stat_dt, '%Y-%m-%d')";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* POST list listing. */
router.post('/list', function(req, res, next) {
  //https://alaveiw.tistory.com/139
  var jsonBody = req.body;
  console.log("startDate:" + jsonBody.startDate);

  var uri = req.url;
  var query = url.parse(uri, true).query;
  // let listArray = ['1010','1019'];
  let listArray = [];
  // var startDate = query.startDate;
  // var endDate = query.endDate;
  var startDate = jsonBody.startDate;
  var endDate = jsonBody.endDate;

  listArray = jsonBody.fleet_id.split(",");

  // console.log(startDate);
  // console.log(endDate);

  connection.query(testQuery,[listArray, startDate, endDate], function (err, rows, fields) { // testQuery 실행
    if(err) console.log('query is not excuted. select fail...\n' + err);
    else res.send(rows);
  });
  // The transaction is now on chain!
  // res.end(JSON.stringify(dbResult, null, 3));
  // res.send(dbResult);

  // 하나의 row를 순차 조회
  /*
  rows.forEach(function(row, i){
    console.log(i+':'+row.first_name+' '+row.last_name+','+row.email);
    if( i==(rows.length - 1)){
      connection.end(function(){
        console.log('database close');
      })
    }
  });
   */
});

/* fncFailureGradeRate 고장 투데이 > 고장 등급별 비중 */
router.post('/fault-pie-ratio', function(req, res, next) {
  var jsonBody = req.body;

  var uri = req.url;
  var query = url.parse(uri, true).query;
  let listArray = [];
  var startDate = jsonBody.startDate;
  var endDate = jsonBody.endDate;
  var fleetId = jsonBody.fleet_id;

  listArray = jsonBody.fleet_id.split(",");

  connection.query(faultCodePieRate_query,[fleetId, startDate, endDate], function (err, rows, fields) { // testQuery 실행
    if(err) console.log('query is not excuted. select fail...\n' + err);
    else res.send(rows);
  });
});

/* 진단 > 편성진단 > DCU 데이터현황 차트 */
router.post('/dcu-chart', function(req, res, next) {
  const retJson = {
    "list": [],
    "listAll":[]
  };

  var jsonBody = req.body;
  var uri = req.url;
  var query = url.parse(uri, true).query;
  let listArray = [];
  var startDate = jsonBody.startDate;
  var endDate = jsonBody.endDate;
  var doorPos = jsonBody.door_pos;

  listArray = jsonBody.fleet_id.split(",");

  //list
  connection.query(getDcuChart_query,[listArray, doorPos, startDate, endDate], function (err, rows, fields) { // testQuery 실행
    if(err) console.log('query is not excuted. select fail...\n' + err);
    else {
      retJson.list = rows;
    }
  });

  //list ALL
  connection.query(getDcuChartAll_query,[startDate, endDate], function (err, rows, fields) { // testQuery 실행
    if(err) console.log('query is not excuted. select fail...\n' + err);
    else {
      retJson.listAll = rows;
    }
    res.send(retJson);
  });

});

/* 고장 > 모델링 > 확률분포 */
router.post('/frequency', function(req, res, next) {
  const request = require('request');
  var jsonBody = req.body;
  var mfds = jsonBody.mfds;

// Form 요청(application/x-www-form-urlencoded)
  const options = {
    uri:'http://10.37.21.23:8000/fault_probability?mfds=' + mfds,
    method: 'POST'
  }
  request.post(options, function(err,httpResponse,body){
    // console.log(body);
    res.send(body);
    }
  );
});

/* 고장 > 모델링 > 고장추이 */
router.post('/fault-modeling-trend', function(req, res, next) {
  const request = require('request');
  var jsonBody = req.body;
  var startDate = jsonBody.startDate;
  var endDate = jsonBody.endDate;
  var fleetId = jsonBody.fleetId;
  var faultCd = jsonBody.faultCd;
  var param = "start_date=" + startDate + "&end_date=" + endDate + "&fleet_id=" + fleetId + "&mfds=" + faultCd;

  // console.log(param);
  // Form 요청(application/x-www-form-urlencoded)
  const options = {
    uri:'http://10.37.21.23:8000/fault_anomaly?'+ param,
    method: 'POST'
  }
  request.post(options, function(err,httpResponse,body){
       res.send(body);
    }
  );
});


module.exports = router;
